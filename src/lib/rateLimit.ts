/**
 * Simple in-memory rate limiter for contract calls and API requests
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if a request is allowed
   * @param key - Unique identifier for the rate limit (e.g., contract address + function name)
   * @returns true if request is allowed, false if rate limited
   */
  check(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove expired requests
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    // Check if limit exceeded
    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }

    // Add new request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );
    
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.requests.clear();
  }
}

// Default rate limiters
export const contractRateLimiter = new RateLimiter({
  maxRequests: 30, // 30 requests
  windowMs: 60000, // per minute
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 60, // 60 requests
  windowMs: 60000, // per minute
});

export const wsRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 reconnection attempts
  windowMs: 60000, // per minute
});

/**
 * Wrapper function to rate limit async operations
 */
export async function withRateLimit<T>(
  key: string,
  fn: () => Promise<T>,
  limiter: RateLimiter = contractRateLimiter
): Promise<T> {
  if (!limiter.check(key)) {
    throw new Error(`Rate limit exceeded for ${key}. Please try again later.`);
  }
  
  return fn();
}

/**
 * Hook-friendly rate limit checker
 */
export function useRateLimit(key: string, limiter: RateLimiter = contractRateLimiter) {
  return {
    canRequest: () => limiter.check(key),
    remaining: () => limiter.getRemaining(key),
    reset: () => limiter.reset(key),
  };
}
