import crypto from "node:crypto";

const ENCRYPTION_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function normalizeCPF(value: string): string {
  return value.replace(/\D/g, "");
}

function getSalt(): string {
  return requireEnv("CRYPTO_SALT");
}

function getEncryptionKey(): Buffer {
  const rawKey = requireEnv("ENCRYPTION_KEY");
  const trimmedKey = rawKey.trim();
  const isHexKey = /^[0-9a-fA-F]{64}$/.test(trimmedKey);
  const key = isHexKey
    ? Buffer.from(trimmedKey, "hex")
    : Buffer.from(trimmedKey, "base64");

  if (key.length !== ENCRYPTION_KEY_BYTES) {
    throw new Error(
      `ENCRYPTION_KEY must decode to ${ENCRYPTION_KEY_BYTES} bytes, received ${key.length}`,
    );
  }

  return key;
}

/**
 * Create a deterministic CPF lookup hash using a site-specific secret salt.
 *
 * @example
 * hashCPF("123.456.789-09")
 */
export function hashCPF(cpf: string): string {
  const normalizedCpf = normalizeCPF(cpf);

  if (normalizedCpf.length !== 11) {
    throw new Error(
      `CPF must normalize to 11 digits, received ${normalizedCpf}`,
    );
  }

  return crypto
    .createHmac("sha256", getSalt())
    .update(normalizedCpf)
    .digest("hex");
}

/**
 * Encrypt a PII value using AES-256-GCM.
 *
 * @example
 * encryptPII("12345678909")
 */
export function encryptPII(value: string): string {
  const normalizedValue = normalizeCPF(value);
  const plaintext = normalizedValue.length > 0 ? normalizedValue : value.trim();
  const iv = crypto.randomBytes(GCM_IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

/**
 * Decrypt an AES-256-GCM encrypted value.
 *
 * @example
 * decryptPII(encryptPII("12345678909"))
 */
export function decryptPII(encrypted: string): string {
  const [ivPart, authTagPart, ciphertextPart] = encrypted.split(".");

  if (!ivPart || !authTagPart || !ciphertextPart) {
    throw new Error(
      `encrypted must be iv.authTag.ciphertext, received ${encrypted}`,
    );
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
