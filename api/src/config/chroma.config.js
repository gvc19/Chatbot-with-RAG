import { ChromaClient } from 'chromadb';
import { logger } from '../utils/logger.js';

// Note: The JavaScript Chroma client talks to a running Chroma server.
// To use local persistence in ./chroma_db, start Chroma with that
// directory as its persist location (see Chroma docs).

const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';

export const CHROMA_COLLECTION_NAME = 'pdf_documents';

export const chromaClient = new ChromaClient({
  path: chromaUrl
});

export async function getOrCreatePdfCollection() {
  try {
    const collection = await chromaClient.getOrCreateCollection({
      name: CHROMA_COLLECTION_NAME,
      metadata: { description: 'PDF document chunks for RAG chatbot' }
    });
    return collection;
  } catch (error) {
    logger.error('Failed to get or create Chroma collection', {
      error: error.message
    });
    error.status = 500;
    error.publicMessage = 'Failed to initialize vector store.';
    throw error;
  }
}

