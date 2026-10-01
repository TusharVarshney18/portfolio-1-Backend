import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireApiKey } from "../lib/auth.js";

const router = Router();

const clickSchema = z.object({
  target: z.string().min(1).max(120),
  href: z.string().max(500).nullable().optional(),
  page: z.string().max(300).nullable().optional(),
});

// Public: fire-and-forget click beacon.
router.post("/", requireApiKey, async (req, res) => {
  const parsed = clickSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid click payload." });
  }

  const click = await prisma.clickEvent.create({
    data: {
      target: parsed.data.target,
      href: parsed.data.href ?? null,
      page: parsed.data.page ?? null,
    },
  });

  return res.status(201).json({ id: click.id });
});

// Admin: most-clicked targets.
router.get("/stats", requireAuth, async (req, res) => {
  const [total, topTargets] = await Promise.all([
    prisma.clickEvent.count(),
    prisma.clickEvent.groupBy({
      by: ["target", "href"],
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),
  ]);

  return res.json({ total, topTargets });
});

export default router;
