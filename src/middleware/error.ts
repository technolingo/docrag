import { inspect } from "node:util";
import type { ErrorRequestHandler } from "express";
import { AppError } from "../domain/errors.ts";

type HttpishError = {
    status?: number;
    statusCode?: number;
    name?: string;
    message?: string;
};

function isHttpError(err: unknown): err is HttpishError {
    return typeof err === "object" && err !== null && ("status" in err || "statusCode" in err);
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.name,
            message: err.message,
        });
        return;
    }

    if (isHttpError(err)) {
        const status = err.status ?? err.statusCode ?? 500;
        res.status(status).json({
            error: err.name ?? "Error",
            message: status < 500 ? err.message : "Internal Server Error", // don't leak 5xx details
        });
        return;
    }

    console.error(inspect(err, { depth: null, colors: true })); // unexpected error
    res.status(500).json({ error: "InternalServerError" }); // don't leak 5xx details
};
