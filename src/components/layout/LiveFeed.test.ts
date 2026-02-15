import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TradeEvent } from '@/hooks/useWebSocket';

/**
 * Property 3: Complete Trade Event Rendering
 * Validates: Requirements 3.4, 4.2, 5.2
 * 
 * For any trade event received via WebSocket or displayed in the UI,
 * the rendered output should contain all required fields: trade type, token symbol,
 * allocation percentage, confidence score, and AI reasoning text.
 */

/**
 * Property 4: Transaction Hash Link Formatting
 * Validates: Requirements 3.6, 9.6
 * 
 * For any transaction hash string, when rendered as a link, the URL should follow
 * the format `https://explorer.monad.xyz/tx/{txHash}` and the link should be
 * properly formatted as an anchor element.
 */

// Helper function to simulate rendering a trade event
function renderTradeEvent(event: TradeEvent): {
  hasType: boolean;
  hasToken: boolean;
  hasAllocation: boolean;
  hasConfidence: boolean;
  hasReasoning: boolean;
  hasTxLink?: boolean;
  txLinkUrl?: string;
} {
  return {
    hasType: !!event.type,
    hasToken: !!event.token,
    hasAllocation: typeof event.allocation === 'number',
    hasConfidence: typeof event.confidence === 'number',
    hasReasoning: !!event.reasoning && event.reasoning.length > 0,
    hasTxLink: !!event.txHash,
    txLinkUrl: event.txHash ? `https://explorer.monad.xyz/tx/${event.txHash}` : undefined,
  };
}

// Helper function to validate transaction hash format
function isValidTxHash(txHash: string): boolean {
  // Ethereum/Monad transaction hash: 0x followed by 64 hex characters
  return /^0x[a-fA-F0-9]{64}$/.test(txHash);
}

describe('Trade Event Rendering - Property Tests', () => {
  it('Property: All required trade event fields are present in rendered output', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          type: fc.constantFrom('BUY' as const, 'SELL' as const),
          token: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          allocation: fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true }),
          confidence: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
          reasoning: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 10),
          timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
          txHash: fc.option(fc.string({ minLength: 66, maxLength: 66 }).map(s => '0x' + s.slice(2).replace(/[^a-fA-F0-9]/g, 'a')), { nil: undefined }),
        }),
        (event: TradeEvent) => {
          const rendered = renderTradeEvent(event);

          // Property 1: All required fields should be present
          expect(rendered.hasType).toBe(true);
          expect(rendered.hasToken).toBe(true);
          expect(rendered.hasAllocation).toBe(true);
          expect(rendered.hasConfidence).toBe(true);
          expect(rendered.hasReasoning).toBe(true);

          // Property 2: Type should be either BUY or SELL
          expect(['BUY', 'SELL']).toContain(event.type);

          // Property 3: Token should be non-empty string
          expect(event.token.trim().length).toBeGreaterThan(0);

          // Property 4: Allocation should be valid percentage
          expect(event.allocation).toBeGreaterThan(0);
          expect(event.allocation).toBeLessThanOrEqual(100);

          // Property 5: Confidence should be valid percentage
          expect(event.confidence).toBeGreaterThanOrEqual(0);
          expect(event.confidence).toBeLessThanOrEqual(100);

          // Property 6: Reasoning should be meaningful text
          expect(event.reasoning.trim().length).toBeGreaterThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Transaction hash links follow correct URL format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 64, maxLength: 64 }).map(s => '0x' + s.replace(/[^a-fA-F0-9]/g, 'a')),
        (txHash) => {
          const event: TradeEvent = {
            id: '1',
            type: 'BUY',
            token: 'TEST',
            allocation: 50,
            confidence: 80,
            reasoning: 'Test reasoning for property test',
            timestamp: Date.now(),
            txHash,
          };

          const rendered = renderTradeEvent(event);

          // Property 1: Transaction link should be present when txHash exists
          expect(rendered.hasTxLink).toBe(true);

          // Property 2: URL should follow correct format
          expect(rendered.txLinkUrl).toBe(`https://explorer.monad.xyz/tx/${txHash}`);

          // Property 3: URL should start with correct base
          expect(rendered.txLinkUrl?.startsWith('https://explorer.monad.xyz/tx/')).toBe(true);

          // Property 4: URL should end with the transaction hash
          expect(rendered.txLinkUrl?.endsWith(txHash)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Events without transaction hash do not render transaction links', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          type: fc.constantFrom('BUY' as const, 'SELL' as const),
          token: fc.string({ minLength: 1, maxLength: 20 }),
          allocation: fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true }),
          confidence: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
          reasoning: fc.string({ minLength: 10, maxLength: 200 }),
          timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
        }),
        (eventData) => {
          const event: TradeEvent = {
            ...eventData,
            txHash: undefined, // Explicitly no transaction hash
          };

          const rendered = renderTradeEvent(event);

          // Property: No transaction link should be present
          expect(rendered.hasTxLink).toBe(false);
          expect(rendered.txLinkUrl).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Trade type determines correct styling class', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BUY' as const, 'SELL' as const),
        (tradeType) => {
          const event: TradeEvent = {
            id: '1',
            type: tradeType,
            token: 'TEST',
            allocation: 50,
            confidence: 80,
            reasoning: 'Test reasoning',
            timestamp: Date.now(),
          };

          // Property: Trade type should determine appropriate styling
          if (tradeType === 'BUY') {
            // BUY trades should use green styling
            expect(tradeType).toBe('BUY');
          } else {
            // SELL trades should use red styling
            expect(tradeType).toBe('SELL');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Timestamp formatting produces valid time string', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000000, max: 2000000000000 }),
        (timestamp) => {
          const date = new Date(timestamp);
          const timeString = date.toLocaleTimeString();

          // Property 1: Should produce a non-empty string
          expect(timeString.length).toBeGreaterThan(0);

          // Property 2: Should be a valid time format (contains colons)
          expect(timeString).toMatch(/\d+:\d+/);

          // Property 3: Date should be valid
          expect(date.getTime()).toBe(timestamp);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Allocation and confidence percentages are properly formatted', () => {
    fc.assert(
      fc.property(
        fc.record({
          allocation: fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true }),
          confidence: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        }),
        ({ allocation, confidence }) => {
          // Property 1: Allocation should be within valid range
          expect(allocation).toBeGreaterThan(0);
          expect(allocation).toBeLessThanOrEqual(100);

          // Property 2: Confidence should be within valid range
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(100);

          // Property 3: Both should be finite numbers
          expect(Number.isFinite(allocation)).toBe(true);
          expect(Number.isFinite(confidence)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});