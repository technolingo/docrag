import type { Request, Response } from "express";
import type { CreateDocumentInput } from "../schemas/documents.schema.ts";
import type { IngestService } from "../services/ingest.service.ts";

export function makeDocumentsController(ingestService: IngestService) {
    async function createDocument(req: Request<unknown, unknown, CreateDocumentInput>, res: Response) {
        // `as CreateDocumentInput` type assertion to compiler, so that both consts are `string` indead of `any`
        // const { title, content } = req.body as CreateDocumentInput;

        // refactored: `req: Request<unknown, unknown, CreateDocumentInput>` more elegantly solves this problem
        // the 3rd param in @types/express Request generic type is the request body type
        // since the request payload validation middleware ran before this in `src/middleware/validate.ts`, we know the type
        const { title, content } = req.body;

        // above is  object destructuring, instead of:
        // const title = req.body.title;
        // const content = req.body.content;

        const doc = await ingestService.ingest(title, content);
        res.status(201).json(doc);
    }

    // ES6 object literal shorthand = { createDocument: createDocument }
    // return with an object wrapper for extensibility
    return { createDocument };
}
