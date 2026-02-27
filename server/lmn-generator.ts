import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { searchTool } from "./tools/search-tool";
import { DynamicTool } from "@langchain/core/tools";
import * as dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: join(__dirname, "../.env") });

// Environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is required");
}

// Initialize the LLM
const llm = new ChatAnthropic({
  model: ANTHROPIC_MODEL,
  temperature: 0.1,
  apiKey: ANTHROPIC_API_KEY,
});

// Define the user query schema
const userQuerySchema = z.object({
  sex: z.string(),
  age: z.number().int().positive(),
  hsa_provider: z.string(),
  state: z.string().length(2),
  diagnosed_conditions: z.array(z.string()),
  family_history: z.array(z.string()),
  risk_factors: z.array(z.string()),
  preventive_targets: z.array(z.string()),
  desired_product: z.string().optional(),
  business_name: z.string().optional(),
});

// Validate the schema
function validateSchema(data: unknown): z.infer<typeof userQuerySchema> {
  try {
    return userQuerySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues.map(err => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid fields: ${missingFields}`);
    }
    throw error;
  }
}

// System prompt
const SYSTEM_PROMPT = `You are a medical documentation specialist tasked with drafting a Letter of Medical Necessity (LMN).
Your goal is to justify, in a formal, concise, professional clinical tone, why the patient should be approved to use the requested product/service under their HSA provider's policy.

IMPORTANT: You have access to a search_tool that can find relevant ICD-10 codes and medical conditions. Use this tool to search for medical conditions mentioned in the patient's data to get accurate ICD codes and condition categories.

OUTPUT FORMAT
Your output must be a single JSON object with exactly these six fields. Every field must be a plain string except icd_codes which is an array of strings. Do not nest objects inside any field.

{
  "reported_diagnosis": "Anxiety (F41.9), Chronic Pain (G89.29)",
  "treatment": "Plain string describing the treatment...",
  "clinical_rationale": "Plain string describing the rationale...",
  "role_the_service_provides": "Plain string describing the role...",
  "conclusion": "Plain string conclusion..."
}

Do not output anything outside of this JSON object. Do not wrap field values in nested objects.

Rules
* Use the search_tool to find the ICD-10 code(s) for the patient's diagnosed conditions. Put the result as a plain string in reported_diagnosis (e.g. "Anxiety (F41.9)") and as an array in icd_codes (e.g. ["F41.9"]).
* Always generate a complete LMN even if the medical reasoning is limited or less direct. Never skip or leave sections blank.
* Ground every claim in the provided intake data or policy excerpts when possible.
* Leave out the physician name, signature, and date.
* If specific supporting details are missing, make the best plausible case from the information available, while still maintaining a professional clinical tone.
* In the clinical rationale section, reference at least one published study by their PMID and abbreviated citation that justifies the service to be clinically necessary for the treatment.
* In the conclusion, end with "medically necessary as part of the patient's comprehensive treatment plan."
* Keep the role the service plays in helping with the patient's health to one sentence.
* Sprinkle in the business name throughout the LMN when you mention the recommended treatment.
* When referring to the patient, only use "the patient."
* If a treatment time frame is mentioned, use the phrasing "as part of the management plan for 12 months."
* In the treatment section only and no other fields, elaborate on an actual exercise or treatment regime.
* Keep the information within one page.
* Keep the style professional, clinical, and persuasive, even if the reasoning is somewhat indirect.`;

// Create a simple tool wrapper for searchTool
const searchToolWrapper = new DynamicTool({
  name: "search_tool",
  description: "Search for medical conditions and ICD-10 codes. Input should be a JSON string with 'query' and optional 'topK' fields.",
  func: async (input: string) => {
    try {
      const params = JSON.parse(input);
      const result = await searchTool(params.query, params.topK || 5);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({ error: "Search failed: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  }
});

// Create the agent
const lmnGenerator = createReactAgent({
  llm,
  tools: [searchToolWrapper],
  prompt: SYSTEM_PROMPT,
});

// Main function to generate LMN
export async function generateLMN(userInput: string): Promise<string> {
  try {
    // Parse and validate the JSON input
    const parsedInput = JSON.parse(userInput);
    const validatedData = validateSchema(parsedInput);
    
    // Convert to the format expected by the agent
    const agentInput = {
      messages: [
        {
          role: "user",
          content: JSON.stringify(validatedData)
        }
      ]
    };
    
    // Run the agent
    const result = await lmnGenerator.invoke(agentInput);
    
    // Extract the final message content as a plain string
    const finalMessage = result.messages[result.messages.length - 1];
    const content = finalMessage.content;
    if (typeof content === 'string') {
      return content;
    } else if (Array.isArray(content)) {
      return content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('');
    }
    return String(content);
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`LMN generation failed: ${error.message}`);
    }
    throw new Error("LMN generation failed with unknown error");
  }
}

// Test function
export async function testLMNGenerator(): Promise<void> {
  const testInput = JSON.stringify({
    name: "Jane Doe",
    age: 32,
    hsa_provider: "HealthEquity",
    state: "NY",
    diagnosed_conditions: ["stress"],
    risk_factors: [""],
    preventive_targets: ["stress"],
    desired_product: "pilates"
  });

  try {
    console.log("Generating LMN...");
    const result = await generateLMN(testInput);
    console.log("Generated LMN:");
    console.log(result);
  } catch (error) {
    console.error("Error generating LMN:", error);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testLMNGenerator();
}
