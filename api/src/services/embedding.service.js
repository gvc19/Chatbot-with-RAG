import { ollama, OLLAMA_EMBED_MODEL } from '../config/ollama.config.js';
import { logger } from '../utils/logger.js';

export async function embedText(text) {
  try {
    const response = await ollama.embeddings({
      model: OLLAMA_EMBED_MODEL,
      prompt: text
    });

    if (!response || !Array.isArray(response.embedding)) {
      const error = new Error('Invalid embedding response from Ollama.');
      error.status = 502;
      error.publicMessage = 'Failed to generate embeddings from Ollama.';
      throw error;
    }

    return response.embedding;
  } catch (error) {
    logger.error('Failed to generate embedding', { error: error.message });
    if (!error.status) {
      error.status = 502;
      error.publicMessage = 'Failed to generate embeddings from Ollama.';
    }
    throw error;
  }
}

export async function embedMany(texts) {
  const embeddings = [];
  for (const text of texts) {
    // Sequential to avoid overloading local Ollama; can be parallelised if desired.
    // eslint-disable-next-line no-await-in-loop
    const emb = await embedText(text);
    embeddings.push(emb);
  }
  logger.info('Generated embeddings for chunks', {
    count: embeddings.length
  });
  return embeddings;
}

