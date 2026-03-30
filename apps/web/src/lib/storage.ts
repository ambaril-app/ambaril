// Cloudflare R2 storage — presigned upload URLs and public URL generation
// Uses S3-compatible API via fetch (no @aws-sdk dependency)

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "ambaril-assets";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://assets.ambaril.com.br

function isConfigured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

export async function getPresignedUploadUrl(
  key: string,
  _contentType: string,
  _expiresIn = 3600,
): Promise<{ url: string; key: string }> {
  // In production, use @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
  // For now, return the R2 endpoint pattern.
  // TODO: Implement proper presigned URL generation with AWS Sigv4

  if (!isConfigured()) {
    console.warn("[R2] Storage not configured. Using placeholder URL.");
    return { url: `https://placeholder.r2.dev/${key}`, key };
  }

  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  return {
    url: `${endpoint}/${R2_BUCKET_NAME}/${key}`,
    key,
  };
}

export function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) return `${R2_PUBLIC_URL}/${key}`;
  if (R2_ACCOUNT_ID) {
    return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;
  }
  return `https://placeholder.r2.dev/${R2_BUCKET_NAME}/${key}`;
}

// Generate a unique storage key for file uploads
export function generateStorageKey(folder: string, filename: string): string {
  const ext = filename.split(".").pop() ?? "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${folder}/${timestamp}-${random}.${ext}`;
}
