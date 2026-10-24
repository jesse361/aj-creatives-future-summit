type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function resetRateLimits() {
  buckets.clear();
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < windowMs);
  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    const retryAfterMs = windowMs - (now - bucket.timestamps[0]);
    return { ok: false as const, retryAfterMs };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true as const };
}
