import { Router } from 'express';
import { validateBody } from '../middleware/validate.ts';
import { createDocumentSchema } from './documents.schema.ts';
import { createDocument } from '../controllers/documents.controller.ts';

const router = Router();

router.post('/', validateBody(createDocumentSchema), createDocument);

export default router;
