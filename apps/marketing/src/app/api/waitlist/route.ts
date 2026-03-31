import { NextResponse } from "next/server";
import { db } from "@ambaril/db";
import { waitlistEntries } from "@ambaril/db/schema";
import { sendEmail } from "@ambaril/email";

const FREE_PROVIDERS = [
  "gmail.com", "googlemail.com", "hotmail.com", "outlook.com",
  "live.com", "yahoo.com", "yahoo.com.br", "icloud.com",
  "me.com", "uol.com.br", "bol.com.br", "terra.com.br",
  "ig.com.br", "r7.com", "msn.com",
];

function isCommercialEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? !FREE_PROVIDERS.includes(domain) : false;
}

interface WaitlistBody {
  email: string;
  name: string;
  brand: string;
  platform: string;
  revenue: string;
  pain?: string;
}

export async function POST(request: Request) {
  let body: WaitlistBody;

  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, name, brand, platform, revenue, pain } = body;

  // Validate required fields
  if (!email || !name || !brand || !platform || !revenue) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate commercial email
  if (!isCommercialEmail(email)) {
    return NextResponse.json({ error: "Commercial email required" }, { status: 422 });
  }

  // Extract IP for deduplication / fraud signals
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // 1. Persist to DB — source of truth
  // ON CONFLICT: silently update updated_at (duplicate submit = same lead, not an error)
  try {
    await db
      .insert(waitlistEntries)
      .values({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        brand: brand.trim(),
        platform,
        revenue,
        pain: pain?.trim() || null,
        ipAddress: ip ?? undefined,
      })
      .onConflictDoUpdate({
        target: waitlistEntries.email,
        set: {
          name: name.trim(),
          brand: brand.trim(),
          platform,
          revenue,
          pain: pain?.trim() || null,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[waitlist] db insert failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // 2. Notify team — best-effort (never blocks the response)
  const notifyTo = process.env.WAITLIST_NOTIFY_EMAIL ?? "oi@ambaril.com";

  sendEmail({
    to: notifyTo,
    subject: `[Waitlist] ${name} — ${brand}`,
    html: `
      <table style="font-family:sans-serif;font-size:14px;color:#334155;max-width:480px">
        <tr><td style="padding-bottom:8px"><strong>Nome:</strong> ${name}</td></tr>
        <tr><td style="padding-bottom:8px"><strong>Email:</strong> ${email}</td></tr>
        <tr><td style="padding-bottom:8px"><strong>Marca:</strong> ${brand}</td></tr>
        <tr><td style="padding-bottom:8px"><strong>Plataforma:</strong> ${platform}</td></tr>
        <tr><td style="padding-bottom:8px"><strong>Faturamento:</strong> ${revenue}</td></tr>
        ${pain ? `<tr><td style="padding-bottom:8px"><strong>Dor:</strong> ${pain}</td></tr>` : ""}
      </table>
    `,
  }).catch((err) => {
    console.error("[waitlist] email notification failed:", err);
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
