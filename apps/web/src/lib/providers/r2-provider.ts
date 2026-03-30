// Cloudflare R2 provider — wraps lib/storage.ts behind StorageProvider interface.
// Modules consume StorageProvider, never R2 directly.

import type { StorageProvider } from "@ambaril/shared/integrations";
import {
  getPresignedUploadUrl as r2PresignedUrl,
  getPublicUrl as r2PublicUrl,
} from "../storage";

export class R2StorageProvider implements StorageProvider {
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<{ url: string; key: string }> {
    return r2PresignedUrl(key, contentType, expiresIn);
  }

  getPublicUrl(key: string): string {
    return r2PublicUrl(key);
  }
}
