import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Chunk } from "../src/domain/types.ts";
import { OllamaGenerator } from "../src/services/generator.ts";

const BASE_URL = "http://ollama.test:11434";

function makeGenerator(temperature = 0): OllamaGenerator {
    return new OllamaGenerator(BASE_URL, "test-model", temperature);
}

function chunk(index: number, text: string): Chunk {
    return { docId: 1, index, text };
}

// minimal stand-in for the parts of `Response` that generate() touches
function fakeResponse(
    body: unknown,
    { ok = true, status = 200 }: { ok?: boolean; status?: number } = {},
): Response {
    return {
        ok,
        status,
        json: async () => body,
    } as unknown as Response;
}

describe("OllamaGenerator", () => {
    test("short-circuits with a fixed message when context is empty (no fetch)", async (t) => {
        const fetchMock = t.mock.method(globalThis, "fetch", async () =>
            fakeResponse({}),
        );

        const answer = await makeGenerator().generate("anything?", []);

        assert.equal(answer, "No relevant context was found in the documents.");
        assert.equal(fetchMock.mock.callCount(), 0);
    });

    test("returns the trimmed model content on a successful call", async (t) => {
        t.mock.method(globalThis, "fetch", async () =>
            fakeResponse({ message: { content: "  the answer  " } }),
        );

        const answer = await makeGenerator().generate("q?", [chunk(0, "ctx")]);
        assert.equal(answer, "the answer");
    });

    test("sends a well-formed request to the chat endpoint", async (t) => {
        const fetchMock = t.mock.method(globalThis, "fetch", async () =>
            fakeResponse({ message: { content: "ok" } }),
        );

        await makeGenerator(0.5).generate("why is the sky blue?", [
            chunk(0, "rayleigh scattering"),
            chunk(1, "shorter wavelengths"),
        ]);

        const [url, init] = fetchMock.mock.calls[0]?.arguments as [
            string,
            RequestInit,
        ];
        assert.equal(url, `${BASE_URL}/api/chat`);
        assert.equal(init.method, "POST");

        const payload = JSON.parse(init.body as string);
        assert.equal(payload.model, "test-model");
        assert.equal(payload.stream, false);
        assert.equal(payload.options.temperature, 0.5);

        // system prompt first, then a user message carrying both sources + question
        assert.equal(payload.messages[0].role, "system");
        assert.equal(payload.messages[1].role, "user");
        assert.match(payload.messages[1].content, /\[Source 1\]/);
        assert.match(payload.messages[1].content, /\[Source 2\]/);
        assert.match(payload.messages[1].content, /rayleigh scattering/);
        assert.match(payload.messages[1].content, /why is the sky blue\?/);
    });

    test("throws when the HTTP response is not ok", async (t) => {
        t.mock.method(globalThis, "fetch", async () =>
            fakeResponse(null, { ok: false, status: 500 }),
        );

        await assert.rejects(
            makeGenerator().generate("q?", [chunk(0, "ctx")]),
            /Ollama chat failed: 500/,
        );
    });

    test("throws when the response carries no content", async (t) => {
        t.mock.method(globalThis, "fetch", async () =>
            fakeResponse({ message: {} }),
        );

        await assert.rejects(
            makeGenerator().generate("q?", [chunk(0, "ctx")]),
            /Ollama returned no content/,
        );
    });
});
