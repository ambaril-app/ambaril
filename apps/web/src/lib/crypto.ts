// Credential encryption — AES-256-GCM with key versioning.
// ENCRYPTION_KEY env var: 64-char hex string (32 bytes).
// ENCRYPTION_KEY_PREVIOUS env var (optional): previous key for rotation.
// Generate with: openssl rand -hex 32

const KEY_VERSION_PREFIX = "v1:";

function getRawKey(envVar = "ENCRYPTION_KEY"): Buffer {
  const keyHex = process.env[envVar];
  if (!keyHex || keyHex.length !== 64) {
    if (envVar === "ENCRYPTION_KEY") {
      throw new Error(
        "[Crypto] ENCRYPTION_KEY must be 64 hex chars (32 bytes). Generate with: openssl rand -hex 32",
      );
    }
    // Optional previous key — return empty to signal not available
    return Buffer.alloc(0);
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns "v1:" + base64(iv[12] + authTag[16] + ciphertext).
 */
export async function encrypt(plaintext: string): Promise<string> {
  const { createCipheriv, randomBytes } = await import("node:crypto");
  const key = getRawKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${KEY_VERSION_PREFIX}${payload}`;
}

/**
 * Decrypt a string produced by encrypt().
 * Supports key rotation: tries current key first, then previous key.
 * Handles both versioned ("v1:...") and legacy (no prefix) formats.
 */
export async function decrypt(encoded: string): Promise<string> {
  // Strip version prefix if present
  const payload = encoded.startsWith(KEY_VERSION_PREFIX)
    ? encoded.slice(KEY_VERSION_PREFIX.length)
    : encoded;

  // Try current key first
  const currentKey = getRawKey("ENCRYPTION_KEY");
  const result = await tryDecrypt(payload, currentKey);
  if (result !== null) return result;

  // Try previous key for rotation support
  const previousKey = getRawKey("ENCRYPTION_KEY_PREVIOUS");
  if (previousKey.length > 0) {
    const prevResult = await tryDecrypt(payload, previousKey);
    if (prevResult !== null) return prevResult;
  }

  throw new Error("[Crypto] Decryption failed with all available keys");
}

async function tryDecrypt(
  encoded: string,
  key: Buffer,
): Promise<string | null> {
  try {
    const { createDecipheriv } = await import("node:crypto");
    const buf = Buffer.from(encoded, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data).toString("utf8") + decipher.final("utf8");
  } catch {
    return null;
  }
}
