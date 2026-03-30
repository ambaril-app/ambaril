// TODO: Replace when WhatsApp Engine module is implemented

interface TemplateMessage {
  to: string;
  templateName: string;
  params: Record<string, string>;
}

export async function sendTemplate(
  message: TemplateMessage,
): Promise<void> {
  // TODO: Replace with real Meta Cloud API call when whatsapp module is implemented
  console.log(
    `[WhatsApp Stub] Would send template "${message.templateName}" to ${message.to}`,
  );
}

export async function sendTextMessage(
  to: string,
  text: string,
): Promise<void> {
  // TODO: Replace with real Meta Cloud API call when whatsapp module is implemented
  console.log(
    `[WhatsApp Stub] Would send text to ${to}: ${text.substring(0, 50)}...`,
  );
}
