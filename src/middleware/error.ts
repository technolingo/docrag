import type { ErrorRequestHandler } from 'express';
import { AppError } from '../domain/errors.ts';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.name, message: err.message });
        return;
    }
    console.log('unexpected:');
    console.log(typeof err);
    console.error(err);  // unexpected error
    res.status(500).json({ error: 'InternalServerError' });  // don't leak bug message
};
