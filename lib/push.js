import { prisma } from "./prisma.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function notifyNewLead(lead) {
  try {
    const tokens = await prisma.deviceToken.findMany();
    if (tokens.length === 0) return;

    const messages = tokens.map((device) => ({
      to: device.token,
      title: "New lead",
      body: `${lead.name} (${lead.email}) sent you a message.`,
      data: { type: "lead", leadId: lead.id },
    }));

    const headers = { "Content-Type": "application/json" };
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("[push] Failed to notify:", err);
  }
}
