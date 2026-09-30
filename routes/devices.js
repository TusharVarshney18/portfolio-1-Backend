import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const deviceSchema = z.object({
  token: z.string().min(1).max(500),
  platform: z.string().max(40).optional(),
});

// Admin (from the mobile app): register this device for push notifications.
router.post("/", requireAuth, async (req, res) => {
  const parsed = deviceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid device payload." });
  }

  const device = await prisma.deviceToken.upsert({
    where: { token: parsed.data.token },
    update: { platform: parsed.data.platform || "expo" },
    create: { token: parsed.data.token, platform: parsed.data.platform || "expo" },
  });

  return res.status(201).json({ id: device.id });
});

router.delete("/:token", requireAuth, async (req, res) => {
  await prisma.deviceToken.deleteMany({ where: { token: req.params.token } });
  return res.json({ ok: true });
});

export default router;
