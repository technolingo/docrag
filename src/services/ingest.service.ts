export class IngestService {
    async ingest(title: string, content: string) {
        // TODO: chunk → embed → store
        return { id: 1, title, content, chunkCount: 0 };
    }
}
