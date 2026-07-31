// Dependency Injection: the only file allowed to use `new`.

import { createApp } from "./app.ts";
import { config } from "./config.ts";
import { makeAskController } from "./controllers/ask.controller.ts";
import { makeDocumentsController } from "./controllers/documents.controller.ts";
import { InMemoryDocumentRepository } from "./repositories/document.repository.ts";
import { InMemoryVectorRepository } from "./repositories/vector.repository.ts";
import { makeAskRouter } from "./routes/ask.routes.ts";
import { makeDocumentsRouter } from "./routes/documents.routes.ts";
import { AskService } from "./services/ask.service.ts";
import { SlidingWindowChunker } from "./services/chunker.ts";
import { OllamaEmbedder } from "./services/embedder.ts";
import { OllamaGenerator } from "./services/generator.ts";
import { IngestService } from "./services/ingest.service.ts";
import { CosineRetriever } from "./services/retriever.ts";

// export async function buildApp() {
export function buildApp() {
    // database
    // const { client, db } = await connectMongo(config.mongo.uri, config.mongo.dbName);

    // adapters: swappable concretes
    // const documentRepository = new MongoDocumentRepository(db.collection("documents"));  // either pass in `db` or collection
    const documentRepository = new InMemoryDocumentRepository();
    const vectorRepository = new InMemoryVectorRepository();
    const chunker = new SlidingWindowChunker(config.chunk.size, config.chunk.overlap);
    const embedder = new OllamaEmbedder(config.embedder.baseUrl, config.embedder.model);
    const retriever = new CosineRetriever(config.retriever.topK);
    const generator = new OllamaGenerator(
        config.generator.baseUrl,
        config.generator.model,
        config.generator.temperature,
    );

    // application service: wired from the abstractions above
    const ingestService = new IngestService(documentRepository, vectorRepository, chunker, embedder);
    const askService = new AskService(vectorRepository, embedder, retriever, generator);

    // web layer: closures over the service
    const documentsController = makeDocumentsController(ingestService);
    const documentsRouter = makeDocumentsRouter(documentsController);
    const askController = makeAskController(askService);
    const askRouter = makeAskRouter(askController);

    const app = createApp({ documentsRouter, askRouter });
    // return { app, client };   // expose the mongoDB client for shutdown
    return app;
}
