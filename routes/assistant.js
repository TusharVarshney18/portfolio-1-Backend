import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireApiKey } from "../lib/auth.js";

const router = Router();

const messageSchema = z.object({
  sessionId: z.string().min(1).max(120),
  sender: z.enum(["user", "bot"]),
  text: z.string().min(1).max(5000),
  visitor: z.string().max(120).optional(),
});

// Public: log a message from the portfolio assistant.
router.post("/messages", requireApiKey, async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid message payload." });
  }

  const { sessionId, sender, text, visitor } = parsed.data;

  const message = await prisma.assistantMessage.create({
    data: { sessionId, sender, text, visitor: visitor || "anonymous" },
  });

  return res.status(201).json({ id: message.id });
});

// Admin: list conversations (latest message per session).
router.get("/conversations", requireAuth, async (req, res) => {
  const conversations = await prisma.assistantMessage.groupBy({
    by: ["sessionId"],
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
  });

  return res.json({ data: conversations });
});

// Admin: full transcript of a single session.
router.get("/conversations/:sessionId", requireAuth, async (req, res) => {
  const messages = await prisma.assistantMessage.findMany({
    where: { sessionId: req.params.sessionId },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ data: messages });
});

export default router;
