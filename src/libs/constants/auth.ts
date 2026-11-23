export const AUTH_RATE_LIMIT = {
  register: { limit: 5, windowMs: 60_000 },
  login: { limit: 10, windowMs: 60_000 },
} as const;
