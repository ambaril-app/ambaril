// Instagram provider — stub for future Instagram Graph API integration.
// Modules consume SocialProvider, never Instagram API directly.

import type {
  SocialProvider,
  SocialProfile,
  SocialMention,
} from "@ambaril/shared/integrations";
import { safeFetch } from "@/lib/safe-fetch";

interface InstagramCredentials {
  accessToken: string;
  businessAccountId: string;
}

export class InstagramSocialProvider implements SocialProvider {
  private credentials: InstagramCredentials | undefined;

  constructor(credentials?: InstagramCredentials) {
    this.credentials = credentials;
  }

  async getProfile(_handle: string): Promise<SocialProfile | null> {
    // TODO: Implement via Instagram Graph API
    return null;
  }

  async searchMentions(
    _hashtag: string,
    _since?: Date,
  ): Promise<SocialMention[]> {
    // TODO: Implement via Instagram Graph API
    return [];
  }

  async testConnection(): Promise<boolean> {
    if (!this.credentials) return false;
    try {
      const res = await safeFetch("https://graph.facebook.com/v21.0/me", {
        headers: { Authorization: `Bearer ${this.credentials.accessToken}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
