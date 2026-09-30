import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireApiKey } from "../lib/auth.js";
import { sendLeadEmails } from "../lib/mailer.js";
import { notifyNewLead } from "../lib/push.js";

const router = Router();

const leadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
  source: z.string().max(60).optional(),
});

// Public: capture a lead (from the portfolio contact form).
router.post("/", requireApiKey, async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Name, email and message are required." });
  }

  const { name, email, message, source } = parsed.data;

  const lead = await prisma.lead.create({
    data: { name, email, message, source: source || "contact-form" },
  });

  // Fire-and-forget side effects so the caller isn't blocked.
  sendLeadEmails({ name, email, message }).catch((err) =>
    console.error("[mail] lead email failed:", err)
  );
  notifyNewLead(lead).catch((err) =>
    console.error("[push] lead notify failed:", err)
  );

  return res.status(201).json({ id: lead.id, createdAt: lead.createdAt });
});

// Admin: list leads with search / filter / pagination.
router.get("/", requireAuth, async (req, res) => {
  const { search, status, page = "1", limit = "20" } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "read") where.isRead = true;
  if (status === "unread") where.isRead = false;

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return res.json({
    total,
    page: pageNum,
    limit: pageSize,
    data: leads,
  });
});

// Admin: aggregate stats for the dashboard.
router.get("/stats", requireAuth, async (req, res) => {
  const [total, unread, week] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { isRead: false } }),
    prisma.lead.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return res.json({ total, unread, last7Days: week });
});

// Admin: single lead.
router.get("/:id", requireAuth, async (req, res) => {
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: "Lead not found." });
  return res.json({ lead });
});

const patchSchema = z.object({
  isRead: z.boolean().optional(),
  note: z.string().max(2000).nullable().optional(),
});

// Admin: mark read/unread, attach a note.
router.patch("/:id", requireAuth, async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid update payload." });
  }

  const data = {};
  if (typeof parsed.data.isRead === "boolean") data.isRead = parsed.data.isRead;
  if ("note" in parsed.data) data.note = parsed.data.note;

  const lead = await prisma.lead.update({
    where: { id: req.params.id },
    data,
  });

  return res.json({ lead });
});

// Admin: delete a lead.
router.delete("/:id", requireAuth, async (req, res) => {
  await prisma.lead.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

export default router;
