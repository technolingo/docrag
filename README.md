# ask-my-docs

Note: I'm a Python developer learning TypeScript, Node.js, and RAG pipeline with this simple project.

This is a small, **hand-rolled Retrieval-Augmented Generation (RAG) API** for practicing TypeScript and Node.js. It ingests a handful of markdown documents and answers natural-language questions grounded in them.

The point isn't to be production-grade — it's to implement **every stage of a RAG pipeline by hand** (chunk → embed → store → retrieve → generate) so each stage is visible and explainable. No RAG framework, no vector database, no cloud APIs — the only external piece is a **local embedding model served by [Ollama](https://ollama.com)**, so embeddings are real and semantic while everything still runs on your own machine with no keys.

## Purpose

- Learn hands-on **TypeScript + Node.js** fundamentals: strict types, ESM, async patterns, layered architecture, error handling, the built-in test runner.
- Build a complete RAG flow with **zero magic** — nothing hidden behind LangChain/LlamaIndex or a managed vector store. If you can explain this codebase, you can explain RAG in an interview.

## Tech stack

```
| Concern    | Choice                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Runtime    | **Node.js 24 (LTS)** — runs `.ts` files natively (type stripping), built-in `--watch` |
| Language   | **TypeScript 6** (`strict: true`)                                                     |
| Pkg Mngr   | **Bun**  (only to replace npm but still use node as runtime for learning)             |
| HTTP       | **Express 5.x**                                                                       |
| Validation | **Zod** (runtime validation at the request boundary, types derived via `z.infer`)     |
| Tests      | **`node:test`** + **`node:assert`** (built-in runner)                                 |
| Storage    | **In-memory** (plain arrays / `Map`) — no database                                    |
| Embeddings | **Ollama** running `nomic-embed-text` locally (called over HTTP via `fetch`)          |
```

**Deliberately not used:** any RAG framework (LangChain, LlamaIndex), any vector database, any cloud AI provider. The only dependency beyond the libraries above is a local Ollama instance — no API keys, no data leaves the machine.

### One honest caveat

**Embedding is real** — each chunk and each query is sent to a local Ollama model (`nomic-embed-text` by default), which returns a genuine semantic vector. Retrieval matches on meaning, not just keyword overlap.

**Generation is still a stub.** The `Generator` returns the top retrieved chunks as the "answer," with citations, rather than calling a chat model. This keeps the focus on retrieval and avoids a second model dependency. Since Ollama can also serve a chat model (e.g. `llama3.1`), upgrading the `Generator` to a real LLM call is a documented stretch goal and reuses the same local Ollama setup.

Both stages sit behind interfaces (`Embedder`, `Generator`), so swapping the embedding model — or turning the generator into a real LLM call — is a single-file change that leaves the rest of the pipeline untouched.

## Architecture

A classic layered design — **routes → controllers → services → repositories** — with two pipelines flowing through it.

### The two pipelines

**Write path (indexing), triggered by `POST /documents`:**

```
raw markdown → chunk → embed → store vectors
```

**Read path (query), triggered by `POST /ask`:**

```
question → embed query → retrieve top-k (cosine) → assemble context → generate answer
```

Both paths share the same in-memory vector store, and both use the **same `Embedder`** — embedding chunks and the query with different vectorizers would make the vectors incomparable.

> Indexing runs synchronously inside the `POST /documents` handler (chunk + embed + store, then respond). For a tiny local corpus that's fine; moving it off the request path is a documented stretch goal.

### Request lifecycle

```
HTTP request
  → Express middleware (json parsing, logging)
  → route → Zod validation → controller
  → service (orchestrates the pipeline)
  → repository (in-memory read/write)
  → controller shapes the response
  → centralized error middleware catches anything thrown
```

Errors are thrown as typed `AppError` subclasses (`NotFoundError`, `ValidationError`) carrying a `statusCode`, and a single error-handling middleware turns them into the right HTTP response.

### Project structure

Notes on project structure
- **Domain Entities** are types passed around internally, such as repository return types, which evolve faster and have more details; whereas **Contract Schemas** are data types for interfaces like API requests, which evolve slower and must consider input validation and backward compatibility.  These two should NOT be confused or interdependent.
- This structure separates files by kind instead of feature/function, which is now a more old-fashioned way.  A more modern structure would **organise by features and not kind** (See: [ALTSTRUCTURE.md](ALTSTRUCTURE.md)), thus achieving more loose-coupling and change collocation.

```
src/
  server.ts                  # start listening
  app.ts                     # Express app + global middleware
  config.ts                  # constants (chunk size, overlap, top-k, Ollama URL + model)
  composition-root.ts        # compose & inject dependencies, only place allowed to use `new`
  domain/
    types.ts                 # Domain Entities: Document, Chunk, EmbeddedChunk, AskResult
    errors.ts                # AppError hierarchy
  schemas/                   # Contract Schemas: request payloads
    documents.schema.ts
    ask.schema.ts
  routes/
    documents.routes.ts
    ask.routes.ts
  controllers/
    documents.controller.ts
    ask.controller.ts
  services/
    ingest.service.ts        # orchestrates chunk → embed → store
    ask.service.ts           # orchestrates embed → retrieve → generate
    chunker.ts               # split text into overlapping windows
    embedder.ts              # Embedder interface + Ollama client (calls /api/embed)
    retriever.ts             # cosine similarity, top-k selection
    generator.ts             # Generator interface + extractive stub
  repositories/
    document.repository.ts   # in-memory Document store (CRUD)
    vector.repository.ts     # in-memory EmbeddedChunk store
  middleware/
    validate.ts              # Zod validation middleware
    error.ts                 # centralized error handler
  lib/
    cosine.ts                # cosine similarity math
tests/
  *.test.ts                  # node:test specs
docs/                        # the markdown corpus to ingest
```

### Core interfaces

The seams that keep the pipeline swappable:

```ts
interface Embedder {
  embed(text: string): Promise<number[]>;
}

interface VectorRepository {
  add(chunk: EmbeddedChunk): Promise<void>;
  all(): Promise<EmbeddedChunk[]>;
  deleteByDocId(docId: number): Promise<void>;
}

interface Generator {
  generate(question: string, context: Chunk[]): Promise<string>;
}
```

## API

| Method   | Path             | Description                                                            |
| -------- | ---------------- | ---------------------------------------------------------------------- |
| `POST`   | `/documents`     | Ingest a doc: `{ title, content }`. Chunks, embeds, and stores it.     |
| `GET`    | `/documents`     | List ingested documents.                                               |
| `GET`    | `/documents/:id` | Fetch one document.                                                    |
| `DELETE` | `/documents/:id` | Delete a document and its chunks.                                      |
| `POST`   | `/ask`           | Answer a question: `{ question }` → grounded answer + cited chunk IDs. |

## Getting started

Requires **Node.js 24+** and **[Ollama](https://ollama.com)** running locally.

```bash
# 1. start Ollama and pull the embedding model (once)
ollama pull nomic-embed-text
ollama serve            # serves the API at http://localhost:11434

# 2. run the app
bun install
bun run dev             # node --watch src/server.ts
```

The `Embedder` calls Ollama's embeddings endpoint:

```
POST http://localhost:11434/api/embed
{ "model": "nomic-embed-text", "input": "text to embed" }
→ { "embeddings": [[0.0123, -0.0456, ...]] }
```

To try a stronger model, `ollama pull mxbai-embed-large` and change the model name in `config.ts` — then re-ingest your docs so the stored vectors match the new model (chunks and queries must be embedded by the _same_ model).

```jsonc
// package.json scripts
{
  "dev": "node --watch src/server.ts",
  "typecheck": "tsc --noEmit",
  "test": "node --test",
}
```

Native `.ts` execution only **strips** types — it does not type-check. Run `bun run typecheck` separately (and in CI).

### Example

```bash
# ingest a doc
curl -X POST localhost:3000/documents \
  -H 'content-type: application/json' \
  -d '{"title":"event-loop","content":"# The event loop\nNode is single-threaded..."}'

# ask
curl -X POST localhost:3000/ask \
  -H 'content-type: application/json' \
  -d '{"question":"is node single threaded?"}'
```

## Stretch goals

Each keeps the existing interfaces, so it's a localized change:

- Move indexing off the request path (return `202`, embed in a background worker).
- Add relevance scores / better source citations to `/ask` responses.
- Swap the embedding model (e.g. `mxbai-embed-large`, `bge-m3`) and re-index.
- Turn the extractive `Generator` into a real LLM call via Ollama (e.g. `llama3.1`).
- Swap the in-memory `VectorRepository` for pgvector.
