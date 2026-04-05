import { NextResponse } from "next/server";
import { db } from "@ambaril/db";
import { sessions, magicLinks } from "@ambaril/db/schema";
import { lt, and, isNotNull } from "drizzle-orm";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  // Verify cron secret (Vercel Cron sends this header)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: Record<string, number> = {};

  // 1. Delete expired sessions
  const expiredSessions = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .returning({ id: sessions.id });
  results.expiredSessions = expiredSessions.length;

  // 2. Delete expired/used magic links older than 24 hours
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const expiredLinks = await db
    .delete(magicLinks)
    .where(
      and(lt(magicLinks.expiresAt, oneDayAgo), isNotNull(magicLinks.usedAt)),
    )
    .returning({ id: magicLinks.id });
  results.expiredMagicLinks = expiredLinks.length;

  return NextResponse.json({
    ok: true,
    cleaned: results,
    timestamp: now.toISOString(),
  });
}
