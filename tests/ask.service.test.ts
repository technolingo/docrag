import assert from "node:assert/strict";
import { describe, mock, test } from "node:test";
import type { EmbeddedChunk } from "../src/domain/types.ts";
import type { VectorRepository } from "../src/repositories/vector.repository.ts";
import { AskService } from "../src/services/ask.service.ts";
import type { Embedder } from "../src/services/embedder.ts";
import type { Generator } from "../src/services/generator.ts";
import type { Retriever } from "../src/services/retriever.ts";

function embedded(docId: number, index: number, text: string): EmbeddedChunk {
    return { docId, index, text, embedding: [0, 0] };
}

// each dependency is a hand-rolled fake whose calls we can inspect
function makeDeps(opts: {
    queryEmbedding?: number[];
    stored?: EmbeddedChunk[];
    retrieved?: EmbeddedChunk[];
    answer?: string;
}) {
    const queryEmbedding = opts.queryEmbedding ?? [0.1, 0.2, 0.3];
    const stored = opts.stored ?? [];
    const retrieved = opts.retrieved ?? [];
    const answer = opts.answer ?? "generated answer";

    const embedder = {
        embed: mock.fn(async (_text: string) => queryEmbedding),
    } satisfies Embedder;

    const vectors = {
        getAll: mock.fn(async () => stored),
        addOne: mock.fn(async () => {}),
        deleteByDocId: mock.fn(async () => {}),
    } satisfies VectorRepository;

    const retriever = {
        retrieve: mock.fn(
            (_q: number[], _chunks: EmbeddedChunk[]) => retrieved,
        ),
    } satisfies Retriever;

    const generator = {
        generate: mock.fn(async (_q: string, _ctx) => answer),
    } satisfies Generator;

    return { embedder, vectors, retriever, generator };
}

describe("AskService.answer", () => {
    test("runs embed → retrieve → generate and shapes the Answer", async () => {
        const retrieved = [embedded(7, 2, "alpha"), embedded(9, 0, "beta")];
        const deps = makeDeps({ answer: "final answer", retrieved });
        const service = new AskService(
            deps.vectors,
            deps.embedder,
            deps.retriever,
            deps.generator,
        );

        const result = await service.answer("what is alpha?");

        assert.deepEqual(result, {
            text: "final answer",
            citations: [
                { docId: 7, index: 2 },
                { docId: 9, index: 0 },
            ],
        });
    });

    test("embeds the question and feeds that vector + stored chunks to the retriever", async () => {
        const queryEmbedding = [0.9, 0.8];
        const stored = [embedded(1, 0, "x"), embedded(1, 1, "y")];
        const deps = makeDeps({ queryEmbedding, stored, retrieved: stored });
        const service = new AskService(
            deps.vectors,
            deps.embedder,
            deps.retriever,
            deps.generator,
        );

        await service.answer("the question");

        assert.deepEqual(deps.embedder.embed.mock.calls[0]?.arguments, [
            "the question",
        ]);
        const retrieveArgs = deps.retriever.retrieve.mock.calls[0]?.arguments;
        assert.deepEqual(retrieveArgs?.[0], queryEmbedding);
        assert.deepEqual(retrieveArgs?.[1], stored);
    });

    test("passes the original question and retrieved context to the generator", async () => {
        const retrieved = [embedded(3, 5, "ctx")];
        const deps = makeDeps({ retrieved });
        const service = new AskService(
            deps.vectors,
            deps.embedder,
            deps.retriever,
            deps.generator,
        );

        await service.answer("explain ctx");

        const genArgs = deps.generator.generate.mock.calls[0]?.arguments;
        assert.equal(genArgs?.[0], "explain ctx");
        assert.deepEqual(genArgs?.[1], retrieved);
    });

    test("produces an empty citations list when nothing is retrieved", async () => {
        const deps = makeDeps({ retrieved: [], answer: "I don't know." });
        const service = new AskService(
            deps.vectors,
            deps.embedder,
            deps.retriever,
            deps.generator,
        );

        const result = await service.answer("unanswerable?");

        assert.deepEqual(result.citations, []);
        assert.equal(result.text, "I don't know.");
    });
});
