import { Pinecone } from "@pinecone-database/pinecone";
import { z } from "zod";
import * as dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: join(__dirname, "../../.env") });

// Environment variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "lmn-generator-ts";
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "lmn-namespace";

if (!PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY environment variable is required");
}

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

const index = pc.index(PINECONE_INDEX_NAME);

// Define the search result schema
const searchResultSchema = z.object({
  icd_code: z.string(),
  condition: z.string(),
  description: z.string(),
  relevance_score: z.number(),
});

const searchResponseSchema = z.object({
  search_results: z.array(searchResultSchema),
  total_found: z.number(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;


/**
 * Search for medical conditions and ICD-10 codes in the knowledge base.
 * 
 * @param query - The medical condition or symptom to search for
 * @param topK - Maximum number of results to return (default: 5)
 * @returns JSON object containing search results with ICD codes, conditions, descriptions, and relevance scores
 */
export async function searchTool(query: string, topK: number = 5): Promise<SearchResponse> {
  try {
    // Perform the search - Pinecone handles embedding conversion
    const results = await index.searchRecords({
      query: {
        topK: topK,
        inputs: {text: query}
      },
      fields: ['chunk_text', 'condition'],
      rerank: {
        model: 'bge-reranker-v2-m3',
        rankFields: ['chunk_text'],
        topN: topK,
      }
    });

    // Process the results
    const searchResults: SearchResult[] = [];
    if (results.result.hits) {
      for (const record of results.result.hits) {
        const condition = (record.fields as any)["condition"] as string || "unknown";
        const chunkText = (record.fields as any)["chunk_text"] as string || "";
        
        searchResults.push({
          icd_code: record._id,
          condition: condition,
          description: `${condition} - ${chunkText}`,
          relevance_score: record._score || 0.0,
        });
        console.log("ok")
      }
    }

    return {
      search_results: searchResults,
      total_found: searchResults.length,
    };
    
  } catch (error) {
    console.error("Search tool error:", error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

searchTool("heart disease")
