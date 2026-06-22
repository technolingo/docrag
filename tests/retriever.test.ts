import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { EmbeddedChunk } from "../src/domain/types.ts";
import { CosineRetriever } from "../src/services/retriever.ts";

function chunk(
    index: number,
    embedding: number[],
    text = `chunk-${index}`,
): EmbeddedChunk {
    return { docId: 1, index, text, embedding };
}

// query points along the x-axis; each chunk's similarity to it is easy to reason about
const query = [1, 0];
const aligned = chunk(0, [1, 0]); // cos = 1
const diagonal = chunk(1, [1, 1]); // cos ≈ 0.707
const orthogonal = chunk(2, [0, 1]); // cos = 0
const opposite = chunk(3, [-1, 0]); // cos = -1

describe("CosineRetriever", () => {
    test("returns the top-k chunks ordered by descending similarity", () => {
        const retriever = new CosineRetriever(2);
        const result = retriever.retrieve(query, [
            orthogonal,
            opposite,
            aligned,
            diagonal,
        ]);

        assert.equal(result.length, 2);
        assert.deepEqual(
            result.map((c) => c.index),
            [aligned.index, diagonal.index],
        );
    });

    test("orders all chunks by similarity when k exceeds the corpus size", () => {
        const retriever = new CosineRetriever(10);
        const result = retriever.retrieve(query, [
            opposite,
            aligned,
            orthogonal,
            diagonal,
        ]);

        assert.deepEqual(
            result.map((c) => c.index),
            [aligned.index, diagonal.index, orthogonal.index, opposite.index],
        );
    });

    test("respects topK exactly", () => {
        const retriever = new CosineRetriever(1);
        const result = retriever.retrieve(query, [diagonal, aligned, opposite]);

        assert.equal(result.length, 1);
        assert.equal(result[0]?.index, aligned.index);
    });

    test("returns an empty array for an empty corpus", () => {
        const retriever = new CosineRetriever(4);
        assert.deepEqual(retriever.retrieve(query, []), []);
    });

    test("returns the original chunk objects, not copies", () => {
        const retriever = new CosineRetriever(1);
        const result = retriever.retrieve(query, [aligned]);
        assert.equal(result[0], aligned);
    });

    test("does not mutate the input array", () => {
        const retriever = new CosineRetriever(2);
        const input = [orthogonal, aligned, diagonal];
        const snapshot = [...input];
        retriever.retrieve(query, input);
        assert.deepEqual(input, snapshot);
    });
});
