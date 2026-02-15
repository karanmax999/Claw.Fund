import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateAllocation, validateAllocationSum, TokenHolding } from './allocation';

/**
 * Property 8: Portfolio Allocation Percentage Accuracy
 * Validates: Requirements 8.3
 * 
 * For any set of treasury holdings with token amounts and values,
 * the calculated allocation percentages should sum to 100% (within 0.1% tolerance for rounding),
 * and each token's percentage should equal (token_value / total_value) * 100.
 */

describe('Portfolio Allocation Calculation - Property Tests', () => {
  it('Property: Allocation percentages sum to 100% within tolerance', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            token: fc.string({ minLength: 1, maxLength: 10 }),
            amount: fc.bigInt({ min: 0n, max: 1000000000000000000n }),
            value: fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (holdings: TokenHolding[]) => {
          const allocations = calculateAllocation(holdings);

          // Property 1: Sum of percentages should be 100% (within 0.1% tolerance)
          const isValid = validateAllocationSum(allocations, 0.1);
          expect(isValid).toBe(true);

          // Property 2: Sum should be close to 100
          const sum = allocations.reduce((total, alloc) => total + alloc.percentage, 0);
          expect(sum).toBeGreaterThanOrEqual(99.9);
          expect(sum).toBeLessThanOrEqual(100.1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Each token percentage equals (token_value / total_value) * 100', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            token: fc.string({ minLength: 1, maxLength: 10 }),
            amount: fc.bigInt({ min: 0n, max: 1000000000000000000n }),
            value: fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (holdings: TokenHolding[]) => {
          const allocations = calculateAllocation(holdings);
          const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

          // Property: Each allocation percentage should match the formula
          allocations.forEach((alloc, index) => {
            const expectedPercentage = (holdings[index].value / totalValue) * 100;
            
            // Allow small floating point tolerance (0.0001%)
            expect(Math.abs(alloc.percentage - expectedPercentage)).toBeLessThan(0.0001);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Allocation values match input holding values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            token: fc.string({ minLength: 1, maxLength: 10 }),
            amount: fc.bigInt({ min: 0n, max: 1000000000000000000n }),
            value: fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (holdings: TokenHolding[]) => {
          const allocations = calculateAllocation(holdings);

          // Property: Each allocation value should match the input holding value
          allocations.forEach((alloc, index) => {
            expect(alloc.value).toBe(holdings[index].value);
          });

          // Property: Token names should match
          allocations.forEach((alloc, index) => {
            expect(alloc.token).toBe(holdings[index].token);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Empty holdings return empty allocations', () => {
    const allocations = calculateAllocation([]);
    expect(allocations).toHaveLength(0);
  });

  it('Property: Zero total value results in zero percentages', () => {
    const holdings: TokenHolding[] = [
      { token: 'TOKEN_A', amount: 100n, value: 0 },
      { token: 'TOKEN_B', amount: 200n, value: 0 },
    ];

    const allocations = calculateAllocation(holdings);

    allocations.forEach(alloc => {
      expect(alloc.percentage).toBe(0);
      expect(alloc.value).toBe(0);
    });
  });

  it('Property: Single holding has 100% allocation', () => {
    fc.assert(
      fc.property(
        fc.record({
          token: fc.string({ minLength: 1, maxLength: 10 }),
          amount: fc.bigInt({ min: 1n, max: 1000000000000000000n }),
          value: fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
        }),
        (holding: TokenHolding) => {
          const allocations = calculateAllocation([holding]);

          expect(allocations).toHaveLength(1);
          expect(allocations[0].percentage).toBeCloseTo(100, 5);
          expect(allocations[0].token).toBe(holding.token);
          expect(allocations[0].value).toBe(holding.value);
        }
      ),
      { numRuns: 50 }
    );
  });
});
