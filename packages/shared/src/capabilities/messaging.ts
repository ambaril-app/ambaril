/**
 * Messaging Capability — send notifications to customers
 * Provider examples: Resend (email), Twilio (SMS), WhatsApp API, mock
 */

export interface MessagingCapability {
  sendEmail(params: {
    tenantId: string;
    to: string;
    subject: string;
    templateId: string;
    variables: Record<string, string>;
  }): Promise<{ messageId: string }>;

  sendSms(params: {
    tenantId: string;
    to: string;
    body: string;
  }): Promise<{ messageId: string }>;

  sendWhatsApp(params: {
    tenantId: string;
    to: string;
    templateName: string;
    variables: Record<string, string>;
  }): Promise<{ messageId: string }>;
}
