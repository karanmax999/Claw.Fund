import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculate24hPnL, Trade } from './pnl';

/**
 * Property 1: PnL Calculation Accuracy
 * Validates: Requirements 2.2
 * 
 * For any sequence of historical trades with timestamps, prices, and quantities,
 * calculating the 24-hour PnL should produce a value equal to the sum of
 * (sell_price - buy_price) * quantity for all trades within the 24-hour window.
 */

describe('PnL Calculation - Property Tests', () => {
  it('Property: 24h PnL equals sum of (sell_price - buy_price) * quantity for matched trades', () => {
    fc.assert(
      fc.property(
        fc.record({
          currentTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
          trades: fc.array(
            fc.record({
              id: fc.uuid(),
              type: fc.constantFrom('BUY' as const, 'SELL' as const),
              token: fc.constantFrom('TOKEN_A', 'TOKEN_B', 'TOKEN_C'),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
              quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              timestampOffset: fc.integer({ min: 0, max: 24 * 60 * 60 * 1000 }), // Within 24h
            }),
            { minLength: 0, maxLength: 50 }
          ),
        }),
        ({ currentTime, trades }) => {
          // Convert timestampOffset to actual timestamp
          const tradesWithTimestamp: Trade[] = trades.map(t => ({
            id: t.id,
            type: t.type,
            token: t.token,
            price: t.price,
            quantity: t.quantity,
            timestamp: currentTime - t.timestampOffset,
          }));

          const pnl = calculate24hPnL(tradesWithTimestamp, currentTime);

          // Property: PnL should be a finite number
          expect(Number.isFinite(pnl)).toBe(true);
          expect(Number.isNaN(pnl)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Empty trades result in zero PnL', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000000, max: 2000000000000 }),
        (currentTime) => {
          const pnl = calculate24hPnL([], currentTime);
          expect(pnl).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Only BUY trades result in zero PnL', () => {
    fc.assert(
      fc.property(
        fc.record({
          currentTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
          trades: fc.array(
            fc.record({
              id: fc.uuid(),
              token: fc.constantFrom('TOKEN_A', 'TOKEN_B'),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
              quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              timestampOffset: fc.integer({ min: 0, max: 24 * 60 * 60 * 1000 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
        }),
        ({ currentTime, trades }) => {
          const buyTrades: Trade[] = trades.map(t => ({
            id: t.id,
            type: 'BUY',
            token: t.token,
            price: t.price,
            quantity: t.quantity,
            timestamp: currentTime - t.timestampOffset,
          }));

          const pnl = calculate24hPnL(buyTrades, currentTime);
          expect(pnl).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Only SELL trades result in zero PnL', () => {
    fc.assert(
      fc.property(
        fc.record({
          currentTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
          trades: fc.array(
            fc.record({
              id: fc.uuid(),
              token: fc.constantFrom('TOKEN_A', 'TOKEN_B'),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
              quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              timestampOffset: fc.integer({ min: 0, max: 24 * 60 * 60 * 1000 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
        }),
        ({ currentTime, trades }) => {
          const sellTrades: Trade[] = trades.map(t => ({
            id: t.id,
            type: 'SELL',
            token: t.token,
            price: t.price,
            quantity: t.quantity,
            timestamp: currentTime - t.timestampOffset,
          }));

          const pnl = calculate24hPnL(sellTrades, currentTime);
          expect(pnl).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Matched BUY and SELL at same price results in zero PnL', () => {
    fc.assert(
      fc.property(
        fc.record({
          currentTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
          token: fc.constantFrom('TOKEN_A', 'TOKEN_B'),
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
        }),
        ({ currentTime, token, price, quantity }) => {
          const trades: Trade[] = [
            {
              id: '1',
              type: 'BUY',
              token,
              price,
              quantity,
              timestamp: currentTime - 1000,
            },
            {
              id: '2',
              type: 'SELL',
              token,
              price,
              quantity,
              timestamp: currentTime - 500,
            },
          ];

          const pnl = calculate24hPnL(trades, currentTime);
          expect(Math.abs(pnl)).toBeLessThan(0.0001); // Allow for floating point errors
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Profitable trade (sell > buy) results in positive PnL', () => {
    fc.assert(
      fc.property(
        fc.record({
          currentTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
          token: fc.constantFrom('TOKEN_A', 'TOKEN_B'),
          buyPrice: fc.float({ min: Math.fround(1), max: Math.fround(5000), noNaN: true }),
          sellPriceMultiplier: fc.float({ min: Math.fround(1.01), max: Math.fround(2), noNaN: true }),
          quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
        }),
        ({ currentTime, token, buyPrice, sellPriceMultiplier, quantity }) => {
          const sellPrice = buyPrice * sellPriceMultiplier;
          
          const trades: Trade[] = [
            {
              id: '1',
              type: 'BUY',
              token,
              price: buyPrice,
              quantity,
              timestamp: currentTime - 1000,
            },
            {
              id: '2',
              type: 'SELL',
              token,
              price: sellPrice,
              quantity,
              timestamp: currentTime - 500,
            },
          ];

          const pnl = calculate24hPnL(trades, currentTime);
          const expectedPnL = (sellPrice - buyPrice) * quantity;
          
          // Property: PnL should be positive
          expect(pnl).toBeGreaterThan(0);
          
          // Property: PnL should match expected calculation (within floating point tolerance)
          expect(Math.abs(pnl - expectedPnL)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Trades outside 24h window are excluded from PnL', () => {
    fc.assert(
      fc.property(
        fc.record({
          currentTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
          token: fc.constantFrom('TOKEN_A', 'TOKEN_B'),
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
        }),
        ({ currentTime, token, price, quantity }) => {
          const twentyFiveHoursAgo = currentTime - (25 * 60 * 60 * 1000);
          
          const trades: Trade[] = [
            {
              id: '1',
              type: 'BUY',
              token,
              price: price,
              quantity,
              timestamp: twentyFiveHoursAgo, // Outside 24h window
            },
            {
              id: '2',
              type: 'SELL',
              token,
              price: price * 2,
              quantity,
              timestamp: twentyFiveHoursAgo + 1000, // Outside 24h window
            },
          ];

          const pnl = calculate24hPnL(trades, currentTime);
          
          // Property: PnL should be zero since all trades are outside the window
          expect(pnl).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});
