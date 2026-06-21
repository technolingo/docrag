import express, { type Request, type Response } from 'express';
import { requestLogger } from './middleware/logging.ts';
import documentsRouter from './routes/documents.routes.ts';
import { errorHandler } from './middleware/error.ts';

const app = express();

// Express runs app.use middleware registrations from top to bottom
app.use(express.json());  // populates req.body from the raw JSON
app.use(requestLogger);  // add response logging callback
app.use('/api/v1/documents', documentsRouter);  // request validation & handling
app.use(errorHandler);  // register error handler last to catch errors thrown before

export default app;
