import { type RequestHandler, Router } from "express";
import { validateBody } from "../middleware/validate.ts";
import { createDocumentSchema } from "./documents.schema.ts";

type DocumentsController = {
    createDocument: RequestHandler; // ending in ; by convention since it's an object type, not object
};

export function makeDocumentsRouter(controller: DocumentsController) {
    const router = Router();
    router.post(
        "/",
        validateBody(createDocumentSchema),
        controller.createDocument,
    );
    return router;
}
