# Backend Project: PDF RAG Chatbot API — Detailed Description

Use this document as context for a backend API. You can copy it and give it to ChatGPT (or another assistant) to ask questions about how it works, design decisions, or how to extend it.

---

## 1. Project Overview

**Name:** pdf-rag-chatbot-backend  
**Purpose:** A Node.js/Express REST API that powers a **RAG (Retrieval-Augmented Generation)** chatbot over PDF documents. Users upload PDFs; the backend indexes them into a vector database. Users then ask questions in natural language; the API retrieves relevant text chunks and uses a local LLM to answer using only that context.

**Core idea:**  
- **Indexing:** PDF → extract text → split into chunks → embed each chunk with an embedding model → store chunks + embeddings in a vector DB (ChromaDB).  
- **Querying:** User question → embed question → find top-K similar chunks in the vector DB → build a prompt with those chunks as “context” → send to a chat LLM → return answer + source references.

**Tech stack:**
- **Runtime:** Node.js (ES modules).
- **Framework:** Express.
- **Vector DB:** ChromaDB (separate server; API talks to it via HTTP).
- **LLM & embeddings:** Ollama (local; embedding model: `nomic-embed-text`, chat model: `llama3`).
- **PDF parsing:** `pdf-parse`.
- **File upload:** Multer (memory storage).
- **Docs:** Swagger/OpenAPI 3.0 at `/api-docs`.
- **Other:** `dotenv`, `cors`, Vercel AI SDK (`ai` package) used only for a non-critical demo call.

**Entry point:** `src/server.js`.  
**Port:** `process.env.PORT` or `3000`.

---

## 2. Project Structure

```
api/
├── src/
│   ├── server.js              # App entry, middleware, route mounting, error handler
│   ├── config/
│   │   ├── chroma.config.js   # ChromaDB client + getOrCreatePdfCollection()
│   │   └── ollama.config.js   # Ollama client, embed/chat model names
│   ├── routes/
│   │   ├── upload.routes.js   # POST /upload (Multer + handleUpload)
│   │   └── chat.routes.js    # POST /chat (handleChat)
│   ├── controllers/
│   │   ├── upload.controller.js  # handleUpload: validate file, call indexPdf
│   │   └── chat.controller.js    # handleChat: read question, call answerQuestion
│   ├── services/
│   │   ├── rag.service.js        # indexPdf(), answerQuestion() — orchestrates RAG
│   │   ├── pdf.service.js        # extractTextFromPdf() via pdf-parse
│   │   ├── chunk.service.js      # chunkText() — token-like chunking with overlap
│   │   ├── embedding.service.js  # embedText(), embedMany() via Ollama
│   │   └── chroma.service.js     # addPdfChunksToChroma(), queryChromaForSimilarChunks()
│   ├── utils/
│   │   └── logger.js             # Simple JSON logger (info, error, warn)
│   └── docs/
│       └── swagger.js            # OpenAPI spec for /upload, /chat, schemas
├── .env / .env.example
└── package.json
```

---

## 3. Configuration and Environment

**Environment variables (e.g. `.env`):**
- `PORT` — Server port (default 3000).
- `OLLAMA_BASE_URL` — Base URL for Ollama (e.g. `http://localhost:11434`). The server copies this to `OLLAMA_HOST` so the Ollama JavaScript client uses it.
- `CHROMA_URL` — Chroma server URL (e.g. `http://localhost:8000`). The Node Chroma client connects here.

**Chroma:**
- Single collection name: `pdf_documents`.
- Collection is created on demand via `getOrCreatePdfCollection()` (no predefined embedding dimension in the config; Chroma infers from first add).

**Ollama:**
- Embedding model: `nomic-embed-text`.
- Chat model: `llama3`.
- All calls go to the same Ollama instance configured by `OLLAMA_BASE_URL` / `OLLAMA_HOST`.

---

## 4. Server and Middleware (`server.js`)

- Loads `dotenv`.
- If `OLLAMA_BASE_URL` is set, sets `process.env.OLLAMA_HOST = process.env.OLLAMA_BASE_URL` (for the Ollama npm client).
- Creates Express app, uses:
  - `cors()`
  - `express.json({ limit: '10mb' })`
  - `express.urlencoded({ extended: true })`
- Mounts:
  - `/upload` → upload routes
  - `/chat` → chat routes
  - `/api-docs` → Swagger UI (serving the spec from `docs/swagger.js`)
- `GET /health` → `{ status: 'ok' }`.
- Global error handler (four-arg middleware):
  - Logs with `logger.error` (message, stack).
  - Response status: `err.status` or 500.
  - Response body: `{ error: { message, code? } }` where `message` is `err.publicMessage` or `err.message` or a generic message. Controllers/services set `error.status` and `error.publicMessage` for client-safe messages.

---

## 5. Upload Flow: Indexing a PDF

**Endpoint:** `POST /upload`  
**Content-Type:** `multipart/form-data`  
**Field name:** `file` (single file).

**Route layer (`upload.routes.js`):**
- Multer with `memoryStorage`, max file size 20 MB.
- Single file: `upload.single('file')`, then `handleUpload`.

**Controller (`upload.controller.js`):**
- Ensures `req.file` exists; else 400, publicMessage: "Please upload a PDF file."
- Ensures `mimetype === 'application/pdf'`; else 400, publicMessage: "Only PDF files are supported."
- Calls `indexPdf(buffer, originalname)` from RAG service.
- On success: responds 201 with `{ message: 'PDF indexed successfully', chunksIndexed }`.
- Any thrown error is passed to `next(error)`.

**RAG service — `indexPdf(buffer, originalName)`:**
1. **Extract text:** `extractTextFromPdf(buffer, originalName)` (pdf.service). Uses `pdf-parse` on the buffer; returns trimmed text. If empty, throws 400 with publicMessage about no extractable text.
2. **Chunk:** `chunkText(text)` (chunk.service). Splits on whitespace into “tokens,” then builds overlapping chunks of 700 tokens with 100-token overlap. Returns array of chunk strings. If no chunks, throws 400.
3. **Embed:** `embedMany(chunks)` (embedding.service). For each chunk, calls Ollama embeddings API with `nomic-embed-text`; returns array of embedding vectors (sequential to avoid overloading Ollama).
4. **Store:** `addPdfChunksToChroma({ documentName: originalName, chunks, embeddings })` (chroma.service). Gets/creates `pdf_documents` collection; builds one ID per chunk (e.g. `documentName-timestamp-index`), metadata `{ documentName, chunkIndex }`; calls `collection.add({ ids, embeddings, documents, metadatas })`.
5. Logs and returns `{ chunksIndexed: chunks.length }`.

**Chroma service — `addPdfChunksToChroma`:**
- Validates chunks length and chunks/embeddings length match.
- `getOrCreatePdfCollection()` from chroma.config.
- Builds ids, documents (chunk text), metadatas; calls `collection.add(...)`. On failure sets 502 and publicMessage about vector database.

**Chunk service — `chunkText(text)`:**
- `TOKENS_PER_CHUNK = 700`, `TOKEN_OVERLAP = 100`.
- Tokenize by `text.split(/\s+/).filter(Boolean)`.
- Sliding window: take 700 tokens, join to string, push chunk; advance by (700 - 100) tokens; repeat until end. Returns array of chunk strings.

**PDF service — `extractTextFromPdf(buffer, originalName)`:**
- `pdf-parse(buffer)` → `data.text` trimmed. If empty, throws 400. Logs documentName and text length. Returns text.

---

## 6. Chat Flow: Answering a Question

**Endpoint:** `POST /chat`  
**Content-Type:** `application/json`  
**Body:** `{ "question": "string" }`.

**Route:** `POST /` → `handleChat`.

**Controller (`chat.controller.js`):**
- Reads `question` from `req.body`.
- Calls `answerQuestion(question)` from RAG service.
- Responds with `{ answer, sources }`. Errors go to global error handler.

**RAG service — `answerQuestion(question)`:**
1. **Validate:** If missing or not a string, throws 400 with publicMessage about requiring a non-empty "question".
2. **Embed question:** `embedText(question)` via Ollama `nomic-embed-text`; returns one embedding vector.
3. **Retrieve:** `queryChromaForSimilarChunks(questionEmbedding, 5)`. Returns top 5 similar chunks (document text + metadata + distance).
4. **No hits:** If none, returns `{ answer: 'I could not find that information in the uploaded documents.', sources: [] }`.
5. **Build context string:** For each hit, format like "Chunk N (source: documentName - chunk index):\n<chunk text>", joined with "\n\n---\n\n".
6. **Build prompt:** System instruction that the model is a helpful PDF QA assistant. User message: "Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer ONLY using the context above. If the context does not contain the answer, say exactly: \"I could not find that information in the uploaded documents.\""
7. **LLM call:** `ollama.chat({ model: 'llama3', messages: [ system, user ] })`. Extracts `response.message.content` trimmed as answer. On Ollama error: 502, publicMessage about failing to generate answer. If answer empty, uses the same fallback sentence.
8. **Sources:** From each hit metadata: `{ documentName, chunkIndex }` (chunkIndex number or null).
9. **Optional:** A separate, non-critical call to Vercel AI SDK `generateText` (e.g. health-check style) is made; errors are caught and only logged (no effect on response).
10. Returns `{ answer, sources }`.

**Chroma service — `queryChromaForSimilarChunks(queryEmbedding, topK = 5)`:**
- Gets `pdf_documents` collection.
- `collection.query({ queryEmbeddings: [queryEmbedding], nResults: topK })`.
- Maps results into array of `{ document, metadata, distance }` for the first query. Returns empty array if no documents. On error, 502 and publicMessage about querying vector database.

**Embedding service:**
- `embedText(text)`: Ollama `embeddings({ model: 'nomic-embed-text', prompt: text })`, returns `response.embedding`; validates it’s an array; on error 502.
- `embedMany(texts)`: sequential `embedText` per item, returns array of embeddings.

---

## 7. Error Handling Conventions

- Controllers use `try/catch` and `next(error)`.
- Services throw errors; many set `error.status` (4xx/5xx) and `error.publicMessage` for safe client messages.
- Global handler uses `err.status`, `err.publicMessage`, and optionally `err.code`; logs full error and stack.

---

## 8. API Summary (for ChatGPT)

| Endpoint       | Method | Purpose |
|----------------|--------|--------|
| `/health`     | GET    | Health check; returns `{ status: 'ok' }`. |
| `/upload`     | POST   | Upload a single PDF (form field `file`); index into Chroma; response includes `chunksIndexed`. |
| `/chat`       | POST   | Send `{ question }` in JSON; get `{ answer, sources }` where sources list documentName and chunkIndex. |
| `/api-docs`   | GET    | Swagger UI for the API. |

Chroma runs as a separate server (e.g. localhost:8000). Ollama runs locally (e.g. localhost:11434) and must have `nomic-embed-text` and `llama3` available. The backend is stateless except for what is stored in Chroma; all PDF content is stored as chunk text + embeddings in the `pdf_documents` collection with metadata for document name and chunk index.

---

You can give this entire document to ChatGPT and ask questions like: “How does chunking work?”, “What happens when I POST to /chat?”, “How can I add a new endpoint to delete a document?”, “Why is embedMany sequential?”, or “How do I change the number of retrieved chunks?”
