"use server";

// Server Actions for preview-banner.tsx (client component).
// "use server" files only allow exported async functions — no re-exports.

import { destroyCreatorSession as _destroy } from "@/lib/creator-auth";

export async function destroyCreatorSession(): Promise<void> {
  await _destroy();
}
