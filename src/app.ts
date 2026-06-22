import express, { type Router } from "express";
import { errorHandler } from "./middleware/error.ts";
import { requestLogger } from "./middleware/logging.ts";

type AppDeps = {
    documentsRouter: Router;
    askRouter: Router;
};

// `{ documentsRouter }: AppDeps` is destructuring + type annotation
// instead of `appDeps: AppDeps`, then `const documentsRouter = appDeps.documentsRouter`
export function createApp({ documentsRouter, askRouter }: AppDeps) {
    const app = express();

    // Express runs app.use middleware registrations from top to bottom
    app.use(express.json()); // populates req.body from the raw JSON
    app.use(requestLogger); // add response logging callback
    app.use("/api/v1/documents", documentsRouter); // request validation & handling
    app.use("/api/v1/ask", askRouter);
    app.use(errorHandler); // register error handler last to catch errors thrown before

    return app;
}
