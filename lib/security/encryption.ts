import "server-only";
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const rawKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

  if (!rawKey || rawKey.length < 32) {
    throw new Error("Missing GOOGLE_TOKEN_ENCRYPTION_KEY. Use a random value with at least 32 characters.");
  }

  return crypto.createHash("sha256").update(rawKey).digest();
}

export function encryptSecret(plainText: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH
  });
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(encryptedValue: string) {
  const [ivPart, authTagPart, encryptedPart] = encryptedValue.split(".");

  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error("Encrypted secret is not in the expected format.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivPart, "base64url"), {
    authTagLength: AUTH_TAG_LENGTH
  });
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
