"use strict";

/**
 * Dead-simple in-memory rate limiter.
 *
 * DO Functions reuse a warm container across invocations, so a module-level Map
 * gives us best-effort per-IP / per-email throttling to cap Tier-2 LLM cost.
 * It is NOT durable across cold starts or multiple containers — that's an
 * accepted trade-off for a free teaser. For hard guarantees, swap the store for
 * a managed KV / Redis later (noted in the README).
 */

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_PER_WINDOW = 1; // one free Tier-2 teaser per key per day

const store = new Map(); // key -> [timestamps]

function _prune(arr, now) {
  return arr.filter((t) => now - t < WINDOW_MS);
}

/**
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
function check(key, { now = Date.now(), limit = MAX_PER_WINDOW } = {}) {
  if (!key) return { allowed: true, remaining: limit, retryAfterMs: 0 };
  const hits = _prune(store.get(key) || [], now);
  if (hits.length >= limit) {
    const oldest = Math.min(...hits);
    return { allowed: false, remaining: 0, retryAfterMs: WINDOW_MS - (now - oldest) };
  }
  hits.push(now);
  store.set(key, hits);
  return { allowed: true, remaining: limit - hits.length, retryAfterMs: 0 };
}

/** Test/maintenance helper. */
function _reset() {
  store.clear();
}

module.exports = { check, _reset, WINDOW_MS, MAX_PER_WINDOW };
