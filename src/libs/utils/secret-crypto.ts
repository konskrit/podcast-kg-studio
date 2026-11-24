import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

import { settingsEnv } from "@/libs/config/env";

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ALGORITHM = "aes-256-gcm";

export function encryptSecret(plaintext: string, aad = ""): string {
  const key = settingsEnv().SETTINGS_ENCRYPTION_KEY;
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  if (aad) {
    cipher.setAAD(Buffer.from(aad, "utf8"));
  }

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64",
  );
}

export function decryptSecret(payload: string, aad = ""): string {
  const key = settingsEnv().SETTINGS_ENCRYPTION_KEY;
  const buf = Buffer.from(payload, "base64");
  const minLength = IV_LENGTH + TAG_LENGTH + 1;
  if (buf.length < minLength) {
    throw new Error("Invalid encrypted payload");
  }

  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(tag);
  if (aad) {
    decipher.setAAD(Buffer.from(aad, "utf8"));
  }

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
