import assert from "node:assert/strict";
import { test } from "node:test";
import { SlidingWindowChunker } from "../src/services/chunker.ts";

test("constructor rejects overlap >= size", () => {
    assert.throws(
        () => new SlidingWindowChunker(10, 10),
        /overlap must be smaller than size/,
    );
    assert.throws(
        () => new SlidingWindowChunker(10, 20),
        /overlap must be smaller than size/,
    );
});

test("constructor accepts overlap < size", () => {
    assert.doesNotThrow(() => new SlidingWindowChunker(10, 3));
});

test("empty text produces no chunks", () => {
    const chunker = new SlidingWindowChunker(10, 3);
    assert.deepEqual(chunker.chunk(1, ""), []);
});

test("whitespace-only text produces no chunks", () => {
    const chunker = new SlidingWindowChunker(10, 3);
    assert.deepEqual(chunker.chunk(1, "        "), []);
});

test("text shorter than size yields a single trimmed chunk", () => {
    const chunker = new SlidingWindowChunker(100, 10);
    const chunks = chunker.chunk(7, "  hello world  ");
    assert.equal(chunks.length, 1);
    assert.deepEqual(chunks[0], { docId: 7, index: 0, text: "hello world" });
});

test("produces overlapping windows with the right step, text, and indices", () => {
    // size 10, overlap 3 => step 7. Text length 20, no whitespace.
    const chunker = new SlidingWindowChunker(10, 3);
    const chunks = chunker.chunk(1, "ABCDEFGHIJKLMNOPQRST");

    // windows start at 0, 7, 14
    assert.equal(chunks.length, 3);
    assert.deepEqual(
        chunks.map((c) => c.index),
        [0, 1, 2],
    );
    assert.deepEqual(
        chunks.map((c) => c.text),
        [
            "ABCDEFGHIJ", // [0, 10)
            "HIJKLMNOPQ", // [7, 17) -- shares H,I,J with the previous window
            "OPQRST", //     [14, 24) -- shares O,P,Q, then runs off the end
        ],
    );
});

test("the same docId is attached to every chunk", () => {
    const chunker = new SlidingWindowChunker(5, 1);
    const chunks = chunker.chunk(42, "abcdefghij");
    assert.ok(chunks.length > 1);
    assert.ok(chunks.every((c) => c.docId === 42));
});

test("blank windows are skipped without leaving a gap in the index", () => {
    // size 4, overlap 0 => step 4. Middle window is all spaces and is dropped,
    // but the surviving chunks must still be numbered 0, 1 (no gap).
    const chunker = new SlidingWindowChunker(4, 0);
    const chunks = chunker.chunk(1, "AAAA    BBBB");
    assert.deepEqual(
        chunks.map((c) => c.text),
        ["AAAA", "BBBB"],
    );
    assert.deepEqual(
        chunks.map((c) => c.index),
        [0, 1],
    );
});
