export const AUTH_RATE_LIMIT = {
  register: { points: 5, durationSec: 60 },
  login: { points: 10, durationSec: 60 },
} as const;
