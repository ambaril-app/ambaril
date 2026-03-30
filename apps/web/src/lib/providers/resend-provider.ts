// Resend provider — wraps lib/email.ts behind MessagingProvider interface.
// Modules consume MessagingProvider, never Resend directly.

import type {
  MessagingProvider,
  EmailOptions,
} from "@ambaril/shared/integrations";
import { sendEmail } from "../email";

export class ResendMessagingProvider implements MessagingProvider {
  async sendEmail(options: EmailOptions): Promise<{ id: string }> {
    return sendEmail(options);
  }
}
