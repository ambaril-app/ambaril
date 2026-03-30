// Credential encryption — AES-256-GCM.
// ENCRYPTION_KEY env var: 64-char hex string (32 bytes).
// Generate with: openssl rand -hex 32

function getRawKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "[Crypto] ENCRYPTION_KEY must be 64 hex chars (32 bytes). Generate with: openssl rand -hex 32",
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns base64(iv[12] + authTag[16] + ciphertext).
 */
export async function encrypt(plaintext: string): Promise<string> {
  const { createCipheriv, randomBytes } = await import("node:crypto");
  const key = getRawKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypt a base64 string produced by encrypt().
 */
export async function decrypt(encoded: string): Promise<string> {
  const { createDecipheriv } = await import("node:crypto");
  const key = getRawKey();
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString("utf8") + decipher.final("utf8");
}
