import { beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

describe("token encryption helpers", () => {
  beforeEach(() => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = "test-encryption-key-with-32-characters";
  });

  it("encrypts and decrypts a refresh token", () => {
    const encrypted = encryptSecret("refresh-token-value");

    expect(encrypted).not.toBe("refresh-token-value");
    expect(decryptSecret(encrypted)).toBe("refresh-token-value");
  });

  it("rejects tampered encrypted values", () => {
    const encrypted = encryptSecret("refresh-token-value");
    const tampered = `${encrypted.slice(0, -2)}xx`;

    expect(() => decryptSecret(tampered)).toThrow();
  });
});
