function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getBcryptRounds(): number {
  const raw = process.env.AUTH_BCRYPT_ROUNDS ?? "12";
  const rounds = Number(raw);
  if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
    throw new Error("AUTH_BCRYPT_ROUNDS must be an integer between 10 and 15");
  }
  return rounds;
}

export function getAuthTimingDummyHash(): string {
  const hash = requireEnv("AUTH_TIMING_DUMMY_HASH");
  if (!hash.startsWith("$2")) {
    throw new Error("AUTH_TIMING_DUMMY_HASH must be a bcrypt hash");
  }
  return hash;
}
