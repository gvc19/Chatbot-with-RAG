import ollama from 'ollama';

// The Ollama JS client reads OLLAMA_HOST; server.js maps OLLAMA_BASE_URL to it.
// This central file exists to keep Ollama-related configuration in one place.

export const OLLAMA_EMBED_MODEL = 'nomic-embed-text';
export const OLLAMA_CHAT_MODEL = 'llama3';

export { ollama };

