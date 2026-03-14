import { getOrCreatePdfCollection } from '../config/chroma.config.js';
import { logger } from '../utils/logger.js';

export async function addPdfChunksToChroma({
  documentName,
  chunks,
  embeddings
}) {
  if (!chunks.length) {
    const error = new Error('No chunks to index.');
    error.status = 400;
    error.publicMessage = 'The uploaded PDF had no indexable content.';
    throw error;
  }

  if (chunks.length !== embeddings.length) {
    const error = new Error('Chunks and embeddings length mismatch.');
    error.status = 500;
    error.publicMessage = 'Internal error while indexing PDF.';
    throw error;
  }

  const collection = await getOrCreatePdfCollection();

  const ids = [];
  const metadatas = [];
  const documents = [];

  const timestamp = Date.now();

  for (let i = 0; i < chunks.length; i += 1) {
    const id = `${documentName}-${timestamp}-${i}`;
    ids.push(id);
    documents.push(chunks[i]);
    metadatas.push({
      documentName,
      chunkIndex: i
    });
  }

  try {
    await collection.add({
      ids,
      embeddings,
      documents,
      metadatas
    });
    logger.info('Stored chunks in Chroma collection', {
      documentName,
      chunkCount: chunks.length
    });
  } catch (error) {
    logger.error('Failed to add documents to Chroma', {
      error: error.message,
      documentName
    });
    error.status = 502;
    error.publicMessage = 'Failed to store embeddings in vector database.';
    throw error;
  }
}

export async function queryChromaForSimilarChunks(queryEmbedding, topK = 5) {
  const collection = await getOrCreatePdfCollection();

  try {
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK
    });

    const { documents, metadatas, distances } = results;

    if (!documents?.length || !documents[0]?.length) {
      return [];
    }

    const hits = documents[0].map((doc, idx) => ({
      document: doc,
      metadata: metadatas[0]?.[idx] || {},
      distance: distances?.[0]?.[idx]
    }));

    return hits;
  } catch (error) {
    logger.error('Failed to query Chroma', { error: error.message });
    error.status = 502;
    error.publicMessage = 'Failed to query vector database.';
    throw error;
  }
}

