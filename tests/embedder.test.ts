import assert from "node:assert/strict";
import { test } from "node:test";
import { OllamaEmbedder } from "../src/services/embedder.ts";

// The embedder only reads res.ok, res.status and res.json(), so a small stub
// is enough -- no need for a real Response or a running Ollama.
function fakeResponse(
    body: unknown,
    init: { ok?: boolean; status?: number } = {},
): Response {
    return {
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => body,
    } as unknown as Response;
}

test("returns the first embedding vector on success", async (t) => {
    const vector = [0.1, 0.2, 0.3];
    t.mock.method(globalThis, "fetch", async () =>
        fakeResponse({ embeddings: [vector] }),
    );

    const embedder = new OllamaEmbedder(
        "http://localhost:11434",
        "nomic-embed-text",
    );
    assert.deepEqual(await embedder.embed("hello"), vector);
});

test("POSTs model + input as JSON to the /api/embed endpoint", async (t) => {
    const fetchMock = t.mock.method(globalThis, "fetch", async () =>
        fakeResponse({ embeddings: [[1, 2, 3]] }),
    );

    const embedder = new OllamaEmbedder("http://host:1234", "my-model");
    await embedder.embed("some text");

    assert.equal(fetchMock.mock.callCount(), 1);
    const call = fetchMock.mock.calls[0];
    assert.ok(call);
    const [url, options] = call.arguments as [string, RequestInit];

    assert.equal(url, "http://host:1234/api/embed");
    assert.equal(options.method, "POST");
    assert.deepEqual(options.headers, { "content-type": "application/json" });
    assert.deepEqual(JSON.parse(options.body as string), {
        model: "my-model",
        input: "some text",
    });
});

test("throws (with the status) when the response is not ok", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
        fakeResponse({}, { ok: false, status: 500 }),
    );

    const embedder = new OllamaEmbedder(
        "http://localhost:11434",
        "nomic-embed-text",
    );
    await assert.rejects(() => embedder.embed("x"), /Ollama embed failed: 500/);
});

test("throws when the response carries no embedding", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
        fakeResponse({ embeddings: [] }),
    );

    const embedder = new OllamaEmbedder(
        "http://localhost:11434",
        "nomic-embed-text",
    );
    await assert.rejects(
        () => embedder.embed("x"),
        /Ollama returned no embedding/,
    );
});
