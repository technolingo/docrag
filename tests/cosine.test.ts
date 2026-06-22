import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { cosineSimilarity } from "../src/lib/cosine.ts";

// floats rarely land on an exact value, so compare within a tolerance
function approx(actual: number, expected: number, eps = 1e-9): void {
    assert.ok(
        Math.abs(actual - expected) < eps,
        `expected ${actual} to be within ${eps} of ${expected}`,
    );
}

describe("cosineSimilarity", () => {
    test("identical unit vectors → 1", () => {
        assert.equal(cosineSimilarity([1, 0, 0], [1, 0, 0]), 1);
    });

    test("orthogonal vectors → 0", () => {
        assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
    });

    test("opposite vectors → -1", () => {
        assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
    });

    test("is magnitude-invariant (only direction matters)", () => {
        // same direction, different lengths → still maximally similar
        approx(cosineSimilarity([1, 2, 3], [2, 4, 6]), 1);
    });

    test("matches the hand-computed value for an arbitrary pair", () => {
        // a·b = 1*4 + 2*5 + 3*6 = 32
        // |a| = sqrt(14), |b| = sqrt(77) → 32 / sqrt(14*77)
        const expected = 32 / Math.sqrt(14 * 77);
        approx(cosineSimilarity([1, 2, 3], [4, 5, 6]), expected);
    });

    test("returns 0 when either vector is all zeros (no divide-by-zero)", () => {
        assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
        assert.equal(cosineSimilarity([1, 1], [0, 0]), 0);
        assert.equal(cosineSimilarity([0, 0], [0, 0]), 0);
    });

    test("is symmetric in its arguments", () => {
        const ab = cosineSimilarity([0.2, 0.9, -0.4], [0.5, -0.1, 0.7]);
        const ba = cosineSimilarity([0.5, -0.1, 0.7], [0.2, 0.9, -0.4]);
        approx(ab, ba);
    });

    test("throws when vector lengths differ", () => {
        assert.throws(() => cosineSimilarity([1, 2, 3], [1, 2]), /same length/);
    });

    test("handles empty vectors as 0 (denominator guard)", () => {
        assert.equal(cosineSimilarity([], []), 0);
    });
});
