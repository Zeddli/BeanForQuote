import { createCipheriv, createDecipheriv } from "node:crypto";

const ZERO_IV = Buffer.alloc(16, 0);

function decodeBase64Key(keyBase64: string) {
  return Buffer.from(keyBase64, "base64");
}

export function encryptCleanversePayload(payload: unknown, keyBase64: string) {
  const key = decodeBase64Key(keyBase64);
  const cipher = createCipheriv("aes-256-cbc", key, ZERO_IV);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return encrypted.toString("base64");
}

export function decryptCleanversePayload<T>(encryptedBase64: string, keyBase64: string): T {
  const key = decodeBase64Key(keyBase64);
  const decipher = createDecipheriv("aes-256-cbc", key, ZERO_IV);
  const encrypted = Buffer.from(encryptedBase64, "base64");
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}
