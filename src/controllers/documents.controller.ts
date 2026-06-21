import type { Request, Response } from 'express';
import { IngestService } from '../services/ingest.service.ts';
import type { CreateDocumentInput } from '../routes/documents.schema.ts';

export function makeDocumentsController(ingestService: IngestService) {
    async function createDocument(req: Request, res: Response) {
        // `as CreateDocumentInput` type assertion to compiler, so that both consts are `string` indead of `any`
        const { title, content } = req.body as CreateDocumentInput; 
        // above object destructuring, instead of:
        // const title = req.body.title;
        // const content = req.body.content;
    
        const doc = await ingestService.ingest(title, content);
        res.status(201).json(doc);
    }

    // ES6 object literal shorthand = { createDocument: createDocument }
    // return with an object wrapper for extensibility
    return { createDocument };
}


