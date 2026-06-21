import assert from "node:assert/strict";
import { test } from "node:test";
import type { EmbeddedChunk } from "../src/domain/types.ts";
import { InMemoryVectorRepository } from "../src/repositories/vector.repository.ts";

function chunk(docId: number, index: number): EmbeddedChunk {
    return {
        docId,
        index,
        text: `doc${docId}-chunk${index}`,
        embedding: [docId, index],
    };
}

test("a fresh repository is empty", async () => {
    const repo = new InMemoryVectorRepository();
    assert.deepEqual(await repo.getAll(), []);
});

test("addOne stores a chunk", async () => {
    const repo = new InMemoryVectorRepository();
    const c = chunk(1, 0);
    await repo.addOne(c);
    assert.deepEqual(await repo.getAll(), [c]);
});

test("getAll returns chunks in insertion order", async () => {
    const repo = new InMemoryVectorRepository();
    const a = chunk(1, 0);
    const b = chunk(1, 1);
    await repo.addOne(a);
    await repo.addOne(b);
    assert.deepEqual(await repo.getAll(), [a, b]);
});

test("deleteByDocId removes only the matching document's chunks", async () => {
    const repo = new InMemoryVectorRepository();
    await repo.addOne(chunk(1, 0));
    await repo.addOne(chunk(2, 0));
    await repo.addOne(chunk(1, 1));

    await repo.deleteByDocId(1);

    const remaining = await repo.getAll();
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0]?.docId, 2);
});

test("deleteByDocId for an unknown docId is a no-op", async () => {
    const repo = new InMemoryVectorRepository();
    await repo.addOne(chunk(1, 0));
    await repo.deleteByDocId(999);
    assert.equal((await repo.getAll()).length, 1);
});

test("deleting one document leaves the others intact", async () => {
    const repo = new InMemoryVectorRepository();
    await repo.addOne(chunk(1, 0));
    await repo.addOne(chunk(2, 0));
    await repo.addOne(chunk(3, 0));

    await repo.deleteByDocId(2);

    const docIds = (await repo.getAll()).map((c) => c.docId).sort();
    assert.deepEqual(docIds, [1, 3]);
});
