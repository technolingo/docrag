import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { buildApp } from "../src/composition-root.ts";

describe("POST /api/v1/documents", () => {
    let server: Server;
    let baseUrl: string;

    before(() => {
        const app = buildApp();
        server = app.listen(0); // 0 = let the OS pick a free port
        const { port } = server.address() as AddressInfo;
        baseUrl = `http://localhost:${port}`;
    });

    after(() => {
        server.close();
    });

    it("returns 201 for a valid body", async () => {
        const res = await fetch(`${baseUrl}/api/v1/documents`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                title: "A Valid Document Title",
                content: "x".repeat(100),
            }),
        });
        assert.equal(res.status, 201);
        const body = (await res.json()) as {
            id: number;
            title: string;
            content: string;
        };
        assert.equal(body.title, "A Valid Document Title");
    });

    it("returns 400 with a structured error for an invalid body", async () => {
        const res = await fetch(`${baseUrl}/api/v1/documents`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title: "short", content: "too short" }),
        });
        assert.equal(res.status, 400);
        const body = (await res.json()) as { error: string; message: string };
        assert.equal(body.error, "ValidationError"); // shape set by your error middleware
    });
});
