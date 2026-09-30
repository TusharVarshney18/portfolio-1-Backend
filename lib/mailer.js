import nodemailer from "nodemailer";

function transporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export function mailConfigured() {
  return Boolean(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);
}

export async function sendLeadEmails({ name, email, message }) {
  if (!mailConfigured()) {
    console.warn("[mail] SMTP not configured — skipping email.");
    return;
  }

  const transport = transporter();

  await transport.sendMail({
    from: `"${name}" <${email}>`,
    to: process.env.SMTP_EMAIL,
    subject: "New Contact Message",
    html: `
      <h3>New Contact Message</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/>${message}</p>
    `,
  });

  await transport.sendMail({
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: "Thank you for reaching out",
    html: `
      <h3>Thank you for reaching out</h3>
      <p>Hi ${name},</p>
      <p>Thank you for taking the time to reach out to me. I appreciate your message and will get back to you as soon as possible.</p>
      <p>Best regards,</p>
      <p>Tushar</p>
    `,
  });
}
