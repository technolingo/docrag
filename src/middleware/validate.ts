import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../domain/errors.ts';

export function validateBody(schema: ZodType): RequestHandler {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.issues.map((i) => i.message).join('; ');
            next(new ValidationError(message));  // hand off to the error handler
            return;
        }
        req.body = result.data;  // now the parsed/cleaned data
        next();                  // pass control to the next handler
    }
}
