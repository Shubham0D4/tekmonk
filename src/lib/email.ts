import "server-only";
import nodemailer from "nodemailer";
import { env, requireServerEnv } from "@/lib/env";

type EmailMessage = { to: string; subject: string; text: string; html: string };

function transport() {
  const host = requireServerEnv("SMTP_HOST");
  const port = Number(requireServerEnv("SMTP_PORT"));
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: requireServerEnv("SMTP_USER"), pass: requireServerEnv("SMTP_PASS") }
  });
}

export async function sendEmail(message: EmailMessage) {
  return transport().sendMail({ from: requireServerEnv("SMTP_FROM"), ...message });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[char] ?? char);
}

export async function sendVerificationEmail(input: { to: string; name: string; url: string }) {
  const url = escapeHtml(input.url);
  await sendEmail({
    to: input.to,
    subject: "Verify your TekMonk email",
    text: `Hi ${input.name}, verify your TekMonk email: ${input.url}`,
    html: `<p>Hi ${escapeHtml(input.name)},</p><p><a href="${url}">Verify your TekMonk email</a>.</p>`
  });
}

export async function sendPasswordResetEmail(input: { to: string; name: string; url: string }) {
  const url = escapeHtml(input.url);
  await sendEmail({
    to: input.to,
    subject: "Reset your TekMonk password",
    text: `Hi ${input.name}, reset your TekMonk password: ${input.url}`,
    html: `<p>Hi ${escapeHtml(input.name)},</p><p><a href="${url}">Reset your password</a>.</p>`
  });
}

export async function sendContactAlert(input: { name: string; email: string; subject?: string; message: string }) {
  if (!env.ADMIN_EMAIL) return;
  await sendEmail({
    to: env.ADMIN_EMAIL,
    subject: `TekMonk contact: ${input.subject || "New message"}`,
    text: `${input.name} <${input.email}>\n\n${input.message}`,
    html: `<p><strong>${escapeHtml(input.name)}</strong> &lt;${escapeHtml(input.email)}&gt;</p><p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>`
  });
}

/** Send a double-opt-in confirmation email to a new newsletter subscriber. */
export async function sendNewsletterConfirmation(input: { to: string; confirmUrl: string }) {
  const url = input.confirmUrl.replace(/[&<>'"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c] ?? c
  );
  await sendEmail({
    to: input.to,
    subject: "Confirm your TekMonk newsletter subscription",
    text: `Confirm your TekMonk newsletter subscription: ${input.confirmUrl}`,
    html: `<p>Thanks for subscribing to TekMonk!</p><p><a href="${url}">Click here to confirm your subscription</a>.</p><p>If you didn't subscribe, you can safely ignore this email.</p>`
  });
}
