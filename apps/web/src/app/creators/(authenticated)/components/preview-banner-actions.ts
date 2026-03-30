"use server";

// Re-export server actions needed by preview-banner.tsx (client component).
// Client components cannot import next/headers directly — they must call
// functions from "use server" files (Server Actions).
export { destroyCreatorSession } from "@/lib/creator-auth";
