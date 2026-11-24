import { z } from "zod";

const settingsEncryptionKeySchema = z.string().transform((value, ctx) => {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    ctx.addIssue({
      code: "custom",
      message: "SETTINGS_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256)",
    });
    return z.NEVER;
  }
  return key;
});

const authEnvSchema = z.object({
  AUTH_BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
});

const settingsEnvSchema = z.object({
  SETTINGS_ENCRYPTION_KEY: settingsEncryptionKeySchema,
});

export type AuthEnv = z.infer<typeof authEnvSchema>;
export type SettingsEnv = z.infer<typeof settingsEnvSchema>;

let authCached: AuthEnv | undefined;
let settingsCached: SettingsEnv | undefined;

export function authEnv(): AuthEnv {
  authCached ??= authEnvSchema.parse(process.env);
  return authCached;
}

export function settingsEnv(): SettingsEnv {
  settingsCached ??= settingsEnvSchema.parse(process.env);
  return settingsCached;
}
