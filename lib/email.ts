import nodemailer from "nodemailer";
import "server-only";
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true", // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM missing");
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return info.messageId;
}