import { Router } from "express";
import { z } from "zod";
import { sendLeadEmails } from "../lib/mailer.js";
import { requireApiKey } from "../lib/auth.js";

const router = Router();

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

// Legacy endpoint kept for backward compatibility.
// Prefer POST /api/leads (which also stores the lead).
router.post("/send-email", requireApiKey, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Name, email and message are required." });
  }

  await sendLeadEmails(parsed.data);

  return res.status(200).json({ message: "Message sent successfully" });
});

export default router;
