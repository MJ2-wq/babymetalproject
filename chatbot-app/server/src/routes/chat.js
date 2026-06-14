import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { listConversations, listMessages, sendChatMessage, getConversationForUser } from "../services/chatService.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get("/conversations", async (req, res, next) => {
  try {
    res.json({ conversations: await listConversations(req.user.id) });
  } catch (error) {
    next(error);
  }
});

chatRouter.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const conversation = await getConversationForUser(req.params.id, req.user.id);
    if (!conversation) return res.status(404).json({ message: "Conversacion no encontrada" });
    res.json({ conversation, messages: await listMessages(req.params.id) });
  } catch (error) {
    next(error);
  }
});

chatRouter.post("/messages", async (req, res, next) => {
  try {
    const data = z.object({
      conversationId: z.number().optional().nullable(),
      content: z.string().min(1).max(8000)
    }).parse(req.body);

    const result = await sendChatMessage({
      userId: req.user.id,
      conversationId: data.conversationId,
      content: data.content
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});
