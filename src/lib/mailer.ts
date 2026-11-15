import nodemailer from "nodemailer";
import { escapeHtml } from "./sanitize";
import { appUrl } from "./utils";

type SendInput = { to: string; subject: string; html: string; text: string };

export async function sendMail(input: SendInput) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log("\n[mail:dev] To:", input.to);
    console.log("[mail:dev] Subject:", input.subject);
    console.log("[mail:dev] Body:\n", input.text, "\n");
    return { delivered: false, logged: true };
  }
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "AdWall <no-reply@localhost>",
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  return { delivered: true, logged: false };
}

function layout(title: string, body: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e2e8f0">
      <p style="color:#0f766e;font-weight:700;letter-spacing:.04em">CLASSINEST</p>
      <h1 style="color:#0f172a;font-size:22px">${escapeHtml(title)}</h1>
      <div style="color:#334155;font-size:15px;line-height:1.6">${body}</div>
    </div>
  </div>`;
}

export async function sendLinkEmail(to: string, name: string, kind: "verify" | "reset" | "admin-reset" | "invite", token: string) {
  const safeName = escapeHtml(name);
  const path =
    kind === "verify"
      ? `/verify-email?token=${token}`
      : kind === "reset"
        ? `/reset-password?token=${token}`
        : `/admin/reset-password?token=${token}`;
  const link = `${appUrl()}${path}`;
  const titles = {
    verify: "Verify your email",
    reset: "Reset your password",
    "admin-reset": "Reset your admin password",
    invite: "Set your admin password",
  };
  const text = `Hello ${name},\n\n${titles[kind]}: ${link}\n\nIf you did not request this, you can ignore this email.`;
  const html = layout(
    titles[kind],
    `<p>Hello ${safeName},</p><p><a href="${escapeHtml(link)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px">Continue</a></p><p style="word-break:break-all">${escapeHtml(link)}</p>`,
  );
  return sendMail({ to, subject: titles[kind], html, text });
}

export async function sendPlainEmail(to: string, subject: string, paragraphs: string[]) {
  const html = layout(
    subject,
    paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join(""),
  );
  const text = paragraphs.join("\n\n");
  return sendMail({ to, subject, html, text });
}
