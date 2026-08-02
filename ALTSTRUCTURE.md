An alternative project structure organised by feature instead of kind, to achieve better loose-coupling and change collocation.

```
src/
  server.ts
  root.ts
  app.ts
  config.ts

  middleware/
    error.ts
    logging.ts
    validate.ts

  utils/
    mongo.ts
    errors.ts
    cosine.ts
    tests/

  embedding/                # shared by documents & ask
    embedder.ts
    vector.repo.ts
    tests/

  documents/
    entities.ts
    schemas.ts
    routes.ts
    controller.ts
    service.ts
    document.repo.ts
    chunker.ts
    tests/

  ask/
    entities.ts
    schemas.ts
    routes.ts
    controller.ts
    service.ts
    retriever.ts
    generator.ts
    tests/

docs/
```

## Design Principles

**Separation of Concerns**: Each layer answers one kind of question: HTTP mechanics (controller), business rules (service), persistence (repository). A change in one concern shouldn't force edits in another — as we discussed with the controller/service split.

**Dependency Rule**: dependencies point inward/downward. Controllers know about services; services know about repositories; but never the reverse. Your retriever.ts has no idea Express exists. This is what makes the inner layers reusable and testable in isolation. The domain types and errors in domain/ sit at the very center — everything may depend on them, they depend on nothing.

**Dependency Inversion Principle**: The D in SOLID. The service depends on the Embedder interface, not on the Ollama client class. The concrete implementation is chosen in the composition root and injected. That's why your README can honestly claim "swapping the embedding model is a single-file change" — the high-level policy (the RAG pipeline) doesn't depend on low-level detail (which HTTP endpoint returns vectors).

**Programming to Interfaces**: i.e. explicit seams. Embedder, Generator, VectorRepository are deliberately narrow contracts. This enables the swap-ability the README brags about, and it enables testing with fakes: hand AskService a stub embedder that returns [1, 0, 0] and you can test retrieval math with no Ollama running.

**Single Responsibility Principle**: applied at file level — one file, one job (chunker.ts only chunks, cosine.ts only does math).

**Inversion of Control**: Components don't fetch their own dependencies; they receive them via *Dependency Injection*.
