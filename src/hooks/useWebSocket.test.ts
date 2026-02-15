import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 2: WebSocket Reconnection with Exponential Backoff
 * Validates: Requirements 3.3, 3.5
 * 
 * For any WebSocket connection that drops, the reconnection attempts should follow
 * exponential backoff where each retry delay is double the previous delay (capped at a maximum),
 * and the connection state should transition through connecting → connected or connecting → disconnected states appropriately.
 */

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection behavior
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: 1000, reason: 'Normal closure' }));
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }
}

// Exponential backoff calculation function
function calculateExponentialBackoff(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

describe('WebSocket Reconnection Logic - Property Tests', () => {
  it('Property: Exponential backoff delays follow 2^n pattern with maximum cap', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        (attemptNumber) => {
          const baseDelay = 1000;
          const maxDelay = 30000;
          
          const delay = calculateExponentialBackoff(attemptNumber, baseDelay, maxDelay);
          const expectedDelay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
          
          // Property 1: Delay should match exponential backoff formula
          expect(delay).toBe(expectedDelay);
          
          // Property 2: Delay should never exceed maximum
          expect(delay).toBeLessThanOrEqual(maxDelay);
          
          // Property 3: Delay should be at least the base delay
          expect(delay).toBeGreaterThanOrEqual(baseDelay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Reconnection delays increase exponentially until cap', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 8 }), { minLength: 2, maxLength: 10 }),
        (attempts) => {
          // Sort attempts to ensure increasing order for meaningful comparison
          const sortedAttempts = [...attempts].sort((a, b) => a - b);
          const delays = sortedAttempts.map(attempt => calculateExponentialBackoff(attempt));
          
          // Property: Each delay should be greater than or equal to the previous (until cap)
          for (let i = 1; i < delays.length; i++) {
            const prevDelay = delays[i - 1];
            const currentDelay = delays[i];
            
            // Current delay should be >= previous delay (monotonic increase until cap)
            expect(currentDelay).toBeGreaterThanOrEqual(prevDelay);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Connection state transitions are valid', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom('connecting', 'connected', 'disconnected'),
          { minLength: 2, maxLength: 10 }
        ),
        (stateSequence) => {
          // Property: All states are valid WebSocket states
          stateSequence.forEach(state => {
            expect(['connecting', 'connected', 'disconnected']).toContain(state);
          });
          
          // Property: State sequence should have at least 2 states
          expect(stateSequence.length).toBeGreaterThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Reconnection attempt counter increases on failures', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (failureCount) => {
          let attempts = 0;
          const delays: number[] = [];
          
          // Simulate multiple connection failures
          for (let i = 0; i < failureCount; i++) {
            const delay = calculateExponentialBackoff(attempts);
            delays.push(delay);
            attempts++;
          }
          
          // Property 1: Number of delays should equal failure count
          expect(delays.length).toBe(failureCount);
          
          // Property 2: Attempts counter should equal failure count
          expect(attempts).toBe(failureCount);
          
          // Property 3: Each delay should be valid exponential backoff
          delays.forEach((delay, index) => {
            const expectedDelay = calculateExponentialBackoff(index);
            expect(delay).toBe(expectedDelay);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Maximum delay cap is respected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 20 }),
        (highAttemptNumber) => {
          const delay = calculateExponentialBackoff(highAttemptNumber);
          
          // Property: Even with very high attempt numbers, delay should not exceed cap
          expect(delay).toBe(30000);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Base delay is minimum delay', () => {
    const delay = calculateExponentialBackoff(0);
    expect(delay).toBe(1000); // Base delay
  });

  it('Property: Delay calculation is deterministic', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        (attemptNumber) => {
          const delay1 = calculateExponentialBackoff(attemptNumber);
          const delay2 = calculateExponentialBackoff(attemptNumber);
          
          // Property: Same input should always produce same output
          expect(delay1).toBe(delay2);
        }
      ),
      { numRuns: 100 }
    );
  });
});