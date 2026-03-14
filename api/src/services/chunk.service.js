// Simple token-based chunking using whitespace tokens as an approximation.
// 700 "tokens" per chunk with 100 token overlap.

const TOKENS_PER_CHUNK = 700;
const TOKEN_OVERLAP = 100;

export function chunkText(text) {
  const tokens = text.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < tokens.length) {
    const end = Math.min(start + TOKENS_PER_CHUNK, tokens.length);
    const chunkTokens = tokens.slice(start, end);
    const chunkText = chunkTokens.join(' ');
    chunks.push(chunkText);

    if (end === tokens.length) break;

    start = end - TOKEN_OVERLAP;
    if (start < 0) start = 0;
  }

  return chunks;
}

