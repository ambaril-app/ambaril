// Resend email integration — transactional emails for Ambaril
// Used for creator welcome, payout notifications, challenge alerts, etc.

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

  const res = await fetch("https://api.resend.com/emails", {
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
    throw new Error(`Resend error: ${res.status} - ${error}`);
  }

  return (await res.json()) as ResendResponse;
}

// ---------- Email templates for Creators module ----------

export async function sendCreatorWelcomeEmail(
  email: string,
  name: string,
  couponCode: string,
): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Bem-vindo ao programa de Creators!",
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0C0E13; color: #D0D4DE;">
        <h1 style="color: #F7F8FA; font-size: 24px; margin-bottom: 16px;">Bem-vindo, ${name}!</h1>
        <p style="font-size: 14px; line-height: 1.65;">Sua aplicação foi aprovada. Você agora faz parte do programa de creators.</p>
        <div style="background: #101216; border: 1px solid #262A34; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="color: #7C8293; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 8px;">Seu cupom exclusivo</p>
          <p style="color: #F7F8FA; font-size: 32px; font-family: 'DM Mono', monospace; font-weight: 500; margin: 0;">${couponCode}</p>
        </div>
        <p style="font-size: 14px; line-height: 1.65;">Compartilhe com seus seguidores e comece a ganhar comissões.</p>
      </div>
    `,
  });
}

export async function sendPayoutNotificationEmail(
  email: string,
  name: string,
  amount: string,
  period: string,
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Pagamento processado — ${period}`,
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0C0E13; color: #D0D4DE;">
        <h1 style="color: #F7F8FA; font-size: 24px; margin-bottom: 16px;">Pagamento processado</h1>
        <p style="font-size: 14px; line-height: 1.65;">Olá ${name}, seu pagamento de <strong style="color: #F7F8FA; font-family: 'DM Mono', monospace;">R$ ${amount}</strong> referente ao período ${period} foi processado.</p>
      </div>
    `,
  });
}

export async function sendChallengeNotificationEmail(
  email: string,
  name: string,
  challengeName: string,
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Novo desafio disponível: ${challengeName}`,
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0C0E13; color: #D0D4DE;">
        <h1 style="color: #F7F8FA; font-size: 24px; margin-bottom: 16px;">Novo desafio!</h1>
        <p style="font-size: 14px; line-height: 1.65;">Olá ${name}, um novo desafio está disponível: <strong style="color: #F7F8FA;">${challengeName}</strong></p>
        <p style="font-size: 14px; line-height: 1.65;">Acesse seu portal para participar.</p>
      </div>
    `,
  });
}
