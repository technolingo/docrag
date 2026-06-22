import { type RequestHandler, Router } from "express";
import { validateBody } from "../middleware/validate.ts";
import { askSchema } from "./ask.schema.ts";

type AskController = {
    answerQuestion: RequestHandler;
};

export function makeAskRouter(controller: AskController) {
    const router = Router();
    router.post("/", validateBody(askSchema), controller.answerQuestion);
    return router;
}
