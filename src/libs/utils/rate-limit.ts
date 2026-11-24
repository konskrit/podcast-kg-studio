import { RateLimiterMemory } from "rate-limiter-flexible";

const limiters = new Map<string, RateLimiterMemory>();

function getLimiter(points: number, durationSec: number): RateLimiterMemory {
  const id = `${points}:${durationSec}`;
  const existing = limiters.get(id);
  if (existing) {
    return existing;
  }

  const limiter = new RateLimiterMemory({
    points,
    duration: durationSec,
  });
  limiters.set(id, limiter);
  return limiter;
}

export async function rateLimit(
  key: string,
  points: number,
  durationSec: number,
): Promise<boolean> {
  try {
    await getLimiter(points, durationSec).consume(key);
    return true;
  } catch {
    return false;
  }
}
