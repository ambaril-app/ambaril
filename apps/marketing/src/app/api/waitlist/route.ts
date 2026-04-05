import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@ambaril/db";
import { waitlistEntries } from "@ambaril/db/schema";
import { sendEmail } from "@ambaril/email";

const FREE_PROVIDERS = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "me.com",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
  "ig.com.br",
  "r7.com",
  "msn.com",
];

function isCommercialEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? !FREE_PROVIDERS.includes(domain) : false;
}

/** Escape HTML special characters to prevent XSS in email templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const waitlistSchema = z.object({
  email: z
    .string()
    .email()
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  name: z
    .string()
    .min(1)
    .max(200)
    .transform((v) => v.trim()),
  brand: z
    .string()
    .min(1)
    .max(200)
    .transform((v) => v.trim()),
  platform: z.string().min(1).max(100),
  revenue: z.string().min(1).max(100),
  pain: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => v?.trim() || null),
});

export async function POST(request: Request) {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }

  const { email, name, brand, platform, revenue, pain } = parsed.data;

  // Validate commercial email
  if (!isCommercialEmail(email)) {
    return NextResponse.json(
      { error: "Commercial email required" },
      { status: 422 },
    );
  }

  // Extract IP for deduplication / fraud signals
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // 1. Persist to DB — source of truth
  try {
    await db
      .insert(waitlistEntries)
      .values({
        email,
        name,
        brand,
        platform,
        revenue,
        pain,
        ipAddress: ip ?? undefined,
      })
      .onConflictDoUpdate({
        target: waitlistEntries.email,
        set: {
          name,
          brand,
          platform,
          revenue,
          pain,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[waitlist] db insert failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // 2. Notify team — HTML-escape all user input to prevent XSS in email clients
  const notifyTo = process.env.WAITLIST_NOTIFY_EMAIL ?? "oi@ambaril.com";

  sendEmail({
    to: notifyTo,
    subject: `[Waitlist] ${escapeHtml(name)} — ${escapeHtml(brand)}`,
    html: `
      <table style="font-family:sans-serif;font-size:14px;color:#334155;max-width:480px">
        <tr><td style="padding-bottom:8px"><strong>Nome:</strong> ${escapeHtml(name)}</td></tr>
        <tr><td style="padding-bottom:8px"><strong>Email:</strong> ${escapeHtml(email)}</td></tr>
        <tr><td style="padding-bottom:8px"><strong>Marca:</strong> ${escapeHtml(brand)}</td></tr>
        <tr><td style="padding-bottom:8px"><strong>Plataforma:</strong> ${escapeHtml(platform)}</td></tr>
        <tr><td style="padding-bottom:8px"><strong>Faturamento:</strong> ${escapeHtml(revenue)}</td></tr>
        ${pain ? `<tr><td style="padding-bottom:8px"><strong>Dor:</strong> ${escapeHtml(pain)}</td></tr>` : ""}
      </table>
    `,
  }).catch((err) => {
    console.error("[waitlist] email notification failed:", err);
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
