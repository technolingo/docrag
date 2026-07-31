import type { Request, Response } from "express";
import type { AskInput } from "../schemas/ask.schema.ts";
import type { AskService } from "../services/ask.service.ts";

export function makeAskController(askService: AskService) {
    async function answerQuestion(req: Request, res: Response) {
        const { question } = req.body as AskInput;
        const answer = await askService.answer(question);
        res.status(200).json(answer);
    }
    return { answerQuestion };
}
