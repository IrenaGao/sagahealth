import { Pinecone } from "@pinecone-database/pinecone";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { readFile, readdir } from "fs/promises";
import { join, extname, dirname } from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: join(__dirname, "../../.env") });

// Environment variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "lmn-generator-ts";

if (!PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY environment variable is required");
}

// Configuration
const DOCS_DIR = join(__dirname, "../support_docs");
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 120;

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

// Check if index exists, create if it doesn't
async function ensureIndexExists() {
  try {
    console.log(`Creating index: ${PINECONE_INDEX_NAME}`);
    await pc.createIndexForModel({
      name: 'integrated-dense-js',
      cloud: 'aws',
      region: 'us-east-1',
      embed: {
        model: 'llama-text-embed-v2',
        fieldMap: { text: 'chunk_text' },
      },
      waitUntilReady: true,
    });
    console.log(`Index ${PINECONE_INDEX_NAME} created successfully`);
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log(`Index ${PINECONE_INDEX_NAME} already exists`);
    } else {
      console.error("Error creating index:", error);
      throw error;
    }
  }
}

const index = pc.index(PINECONE_INDEX_NAME);

// Initialize text splitter
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
});


// Process ICD10 codes JSON file
async function processICD10Codes(): Promise<any[]> {
  const icd10JsonPath = join(DOCS_DIR, "icd10-codes.json");
    const fileContent = await readFile(icd10JsonPath, "utf-8");
    const icd10Data = JSON.parse(fileContent);
    
    const records: any[] = [];
    
    if (icd10Data.icd10_codes && Array.isArray(icd10Data.icd10_codes)) {
      for (const codeEntry of icd10Data.icd10_codes) {
        if (codeEntry.code && codeEntry.description) {
          records.push({
            id: codeEntry.code,
            values: new Array(1024).fill(0).map(() => Math.random()), // Dummy vector
            metadata: {
              chunk_text: codeEntry.description,
              condition: codeEntry.condition || "Unknown",
            },
          });
        }
      }
    
  } 
  return records;
}


// Main ingestion function
export async function ingestDocuments(): Promise<void> {
  try {
    console.log("Starting document ingestion...");
    
    // Ensure index exists first
    await ensureIndexExists();
    
    // Skip clearing data for new index
    console.log("Skipping data clearing for new index...");
    
    // Process ICD10 codes
    console.log("Processing ICD10 codes...");
    const allRecords = await processICD10Codes();
    console.log(`Found ${allRecords.length} ICD10 records`);
    
    if (allRecords.length === 0) {
      console.log("No records to ingest");
      return;
    }
    
    // Ingest in batches
    const batchSize = 100;
    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);
      console.log(`Ingesting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allRecords.length / batchSize)}`);
      
      await index.upsert(batch);
    }
    
    console.log("Document ingestion completed successfully!");
    
  } catch (error) {
    console.error("Error during document ingestion:", error);
    throw error;
  }
}

// Run ingestion if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDocuments();
}
