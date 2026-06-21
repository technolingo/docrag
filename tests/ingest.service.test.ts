import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryDocumentRepository } from "../src/repositories/document.repository.ts";
import { InMemoryVectorRepository } from "../src/repositories/vector.repository.ts";
import { SlidingWindowChunker } from "../src/services/chunker.ts";
import type { Embedder } from "../src/services/embedder.ts";
import { IngestService } from "../src/services/ingest.service.ts";

// A deterministic, offline Embedder that also records what it was asked to embed.
// Returns a 1-D vector equal to [text.length] so assertions can stay exact.
class FakeEmbedder implements Embedder {
    public readonly seen: string[] = [];
    async embed(text: string): Promise<number[]> {
        this.seen.push(text);
        return [text.length];
    }
}

// Wire IngestService with real in-memory collaborators + the fake embedder.
// Using real repos/chunker makes this a "sociable" unit test: it exercises the
// orchestration and the real chunk/store behaviour, only faking the network call.
function build(chunkSize = 1000, overlap = 0) {
    const docs = new InMemoryDocumentRepository();
    const vectors = new InMemoryVectorRepository();
    const chunker = new SlidingWindowChunker(chunkSize, overlap);
    const embedder = new FakeEmbedder();
    const service = new IngestService(docs, vectors, chunker, embedder);
    return { docs, vectors, chunker, embedder, service };
}

test("ingest persists the document and reports the chunk count", async () => {
    const { service, docs } = build();
    const result = await service.ingest("My Title", "short content");

    assert.deepEqual(result, { id: 1, title: "My Title", chunkCount: 1 });

    const stored = await docs.getDocument(1);
    assert.equal(stored?.title, "My Title");
    assert.equal(stored?.content, "short content");
});

test("ingest embeds every chunk exactly once, using the chunk text", async () => {
    const { service, embedder, chunker } = build(10, 0); // step 10
    const content = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 26 chars -> 3 windows

    await service.ingest("Doc title here", content);

    // The embedder should have seen exactly the chunker's output, in order.
    const expected = chunker.chunk(1, content).map((c) => c.text);
    assert.equal(expected.length, 3);
    assert.deepEqual(embedder.seen, expected);
});

test("ingest stores one embedded chunk per chunk, tagged with docId + embedding", async () => {
    const { service, vectors } = build(10, 0);
    const content = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const { id } = await service.ingest("Doc title here", content);

    const stored = await vectors.getAll();
    assert.equal(stored.length, 3);
    assert.ok(stored.every((c) => c.docId === id));
    // FakeEmbedder returns [text.length]; confirm each stored chunk kept its
    // own text and got the matching embedding attached.
    for (const c of stored) {
        assert.deepEqual(c.embedding, [c.text.length]);
    }
});

test("ingesting twice assigns sequential document ids and keeps both sets", async () => {
    const { service, vectors } = build(10, 0);
    const first = await service.ingest("First title!", "ABCDEFGHIJKLMNOP"); // 16 -> 2 chunks
    const second = await service.ingest("Second title", "ABCDEFGHIJ"); // 10 -> 1 chunk

    assert.equal(first.id, 1);
    assert.equal(second.id, 2);

    const stored = await vectors.getAll();
    assert.equal(stored.length, first.chunkCount + second.chunkCount);
    assert.equal(stored.filter((c) => c.docId === 1).length, first.chunkCount);
    assert.equal(stored.filter((c) => c.docId === 2).length, second.chunkCount);
});

test("ingesting empty content stores nothing and reports zero chunks", async () => {
    const { service, vectors, embedder } = build();
    const result = await service.ingest("Empty doc title", "");

    assert.equal(result.chunkCount, 0);
    assert.deepEqual(await vectors.getAll(), []);
    assert.deepEqual(embedder.seen, []); // embedder never called
});
