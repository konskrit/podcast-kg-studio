import { z } from "zod";

const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email(),
);

/** Shared credentials shape (Zod 4: use z.email(), not z.string().email()). */
export const credentialsSchema = z.object({
  email: emailSchema,
  // bcrypt only uses 72 bytes; reject longer inputs explicitly.
  password: z.string().min(8).max(72),
});

export const registerSchema = credentialsSchema.extend({
  name: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export function formString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}
