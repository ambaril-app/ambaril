// Resend email integration — transactional emails for Ambaril

import { safeFetch } from "@/lib/safe-fetch";
import { escapeHtml } from "@ambaril/shared/utils";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.FROM_EMAIL || "Ambaril <no-reply@ambaril.com.br>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface ResendResponse {
  id: string;
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ id: string }> {
  if (!RESEND_API_KEY) {
    console.warn(
      `[Email] Not configured. Would send to ${options.to}: ${options.subject}`,
    );
    return { id: `mock-${Date.now()}` };
  }

  const res = await safeFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    // In development, log and continue rather than crashing the flow
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[Email] Resend error (dev, ignored): ${res.status} - ${error}`,
      );
      console.info(`[Email] Would send to ${options.to}: ${options.subject}`);
      return { id: `dev-${Date.now()}` };
    }
    throw new Error(`Resend error: ${res.status} - ${error}`);
  }

  return (await res.json()) as ResendResponse;
}

// ===== Auth Emails =====

export async function sendMagicLinkEmail(
  to: string,
  link: string,
): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info(`\n[Magic Link] ${to}\n→ ${link}\n`);
  }
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin: 0; padding: 0; background: #F5F6FA; font-family: 'Geist', -apple-system, sans-serif; }
  .wrapper { max-width: 480px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E8EAF0; border-radius: 12px; overflow: hidden; }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid #F0F1F5; }
  .wordmark { font-size: 20px; font-weight: 700; color: #1A1D27; letter-spacing: -0.5px; }
  .body { padding: 32px 40px; }
  h1 { font-size: 22px; font-weight: 700; color: #1A1D27; margin: 0 0 12px; }
  p { font-size: 14px; color: #5C6176; line-height: 1.6; margin: 0 0 24px; }
  .btn { display: inline-block; background: oklch(65% 0.12 60); color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; }
  .expiry { font-size: 13px; color: #8B90A4; margin: 24px 0 0; }
  .footer { padding: 24px 40px; background: #F8F9FC; border-top: 1px solid #F0F1F5; }
  .footer p { font-size: 12px; color: #8B90A4; margin: 0; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="wordmark">Ambaril</div>
  </div>
  <div class="body">
    <h1>Acesse o Ambaril</h1>
    <p>Clique no botão abaixo para entrar na plataforma. O link é de uso único e expira em 15 minutos.</p>
    <a href="${link}" class="btn">Acessar agora</a>
    <p class="expiry">Este link expira em 15 minutos.</p>
  </div>
  <div class="footer">
    <p>Se você não solicitou este acesso, ignore este email.</p>
  </div>
</div>
</body>
</html>`;

  await sendEmail({
    to,
    subject: "Seu link de acesso ao Ambaril",
    html,
  });
}

export async function sendSignupEmail(
  to: string,
  link: string,
  companyName: string,
): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info(`\n[Signup Link] ${to} (${companyName})\n→ ${link}\n`);
  }
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin: 0; padding: 0; background: #F5F6FA; font-family: 'Geist', -apple-system, sans-serif; }
  .wrapper { max-width: 480px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E8EAF0; border-radius: 12px; overflow: hidden; }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid #F0F1F5; }
  .wordmark { font-size: 20px; font-weight: 700; color: #1A1D27; letter-spacing: -0.5px; }
  .body { padding: 32px 40px; }
  h1 { font-size: 22px; font-weight: 700; color: #1A1D27; margin: 0 0 12px; }
  p { font-size: 14px; color: #5C6176; line-height: 1.6; margin: 0 0 24px; }
  .btn { display: inline-block; background: oklch(65% 0.12 60); color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; }
  .expiry { font-size: 13px; color: #8B90A4; margin: 24px 0 0; }
  .footer { padding: 24px 40px; background: #F8F9FC; border-top: 1px solid #F0F1F5; }
  .footer p { font-size: 12px; color: #8B90A4; margin: 0; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="wordmark">Ambaril</div>
  </div>
  <div class="body">
    <h1>Confirme seu email</h1>
    <p>Seu workspace <strong>${escapeHtml(companyName)}</strong> está quase pronto. Confirme seu email para ativar o acesso.</p>
    <a href="${link}" class="btn">Confirmar email</a>
    <p class="expiry">Este link expira em 15 minutos.</p>
  </div>
  <div class="footer">
    <p>Se você não criou uma conta no Ambaril, ignore este email.</p>
  </div>
</div>
</body>
</html>`;

  await sendEmail({
    to,
    subject: `Confirme seu email — Workspace ${escapeHtml(companyName)}`,
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  link: string,
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin: 0; padding: 0; background: #F5F6FA; font-family: 'Geist', -apple-system, sans-serif; }
  .wrapper { max-width: 480px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E8EAF0; border-radius: 12px; overflow: hidden; }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid #F0F1F5; }
  .wordmark { font-size: 20px; font-weight: 700; color: #1A1D27; letter-spacing: -0.5px; }
  .body { padding: 32px 40px; }
  h1 { font-size: 22px; font-weight: 700; color: #1A1D27; margin: 0 0 12px; }
  p { font-size: 14px; color: #5C6176; line-height: 1.6; margin: 0 0 24px; }
  .btn { display: inline-block; background: oklch(65% 0.12 60); color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; }
  .expiry { font-size: 13px; color: #8B90A4; margin: 24px 0 0; }
  .footer { padding: 24px 40px; background: #F8F9FC; border-top: 1px solid #F0F1F5; }
  .footer p { font-size: 12px; color: #8B90A4; margin: 0; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="wordmark">Ambaril</div>
  </div>
  <div class="body">
    <h1>Redefinir senha</h1>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.</p>
    <a href="${link}" class="btn">Redefinir senha</a>
    <p class="expiry">Este link expira em 15 minutos.</p>
  </div>
  <div class="footer">
    <p>Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanece inalterada.</p>
  </div>
</div>
</body>
</html>`;

  await sendEmail({
    to,
    subject: "Redefinir sua senha no Ambaril",
    html,
  });
}
