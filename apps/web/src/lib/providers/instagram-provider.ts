// Instagram provider — stub for future Instagram Graph API integration.
// Modules consume SocialProvider, never Instagram API directly.

import type {
  SocialProvider,
  SocialProfile,
  SocialMention,
} from "@ambaril/shared/integrations";

export class InstagramSocialProvider implements SocialProvider {
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
}
