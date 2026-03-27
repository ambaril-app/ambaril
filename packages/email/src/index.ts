// Stub — Resend integration will be added in Phase 2+
// For now, emails are logged to console in development

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Email Stub] To: ${payload.to} | Subject: ${payload.subject}`);
    return;
  }
  // TODO: Resend integration
  throw new Error("Email sending not configured. Set RESEND_API_KEY.");
}
