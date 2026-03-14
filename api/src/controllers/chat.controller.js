import { answerQuestion } from '../services/rag.service.js';

export async function handleChat(req, res, next) {
  try {
    const { question } = req.body || {};

    const result = await answerQuestion(question);

    res.json({
      answer: result.answer,
      sources: result.sources
    });
  } catch (error) {
    next(error);
  }
}

