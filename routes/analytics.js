import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireApiKey } from "../lib/auth.js";

const router = Router();

const eventSchema = z.object({
  type: z.string().min(1).max(40),
  page: z.string().max(300).nullable().optional(),
  referrer: z.string().max(300).nullable().optional(),
  userAgent: z.string().max(500).nullable().optional(),
});

// Public: fire-and-forget analytics beacon.
router.post("/events", requireApiKey, async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid analytics event." });
  }

  const event = await prisma.analyticsEvent.create({
    data: {
      type: parsed.data.type,
      page: parsed.data.page ?? null,
      referrer: parsed.data.referrer ?? null,
      userAgent: parsed.data.userAgent ?? null,
    },
  });

  return res.status(201).json({ id: event.id });
});

// Admin: stats for the dashboard (totals, daily series, top pages, referrers).
router.get("/stats", requireAuth, async (req, res) => {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [total, pageviews, visitors, series, topPages, referrers] =
    await Promise.all([
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.count({ where: { type: "pageview" } }),
      prisma.analyticsEvent.count({ where: { type: "visitor" } }),
      prisma.$queryRaw`
        SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::int AS count
        FROM "AnalyticsEvent"
        WHERE type = 'pageview' AND "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1 ASC
      `,
      prisma.analyticsEvent.groupBy({
        by: ["page"],
        where: { type: "pageview", createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["referrer"],
        where: { referrer: { not: null }, createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
    ]);

  return res.json({ total, pageviews, visitors, series, topPages, referrers });
});

export default router;
