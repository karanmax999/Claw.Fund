// Portfolio allocation calculation utilities

export interface TokenHolding {
  token: string;
  amount: bigint;
  value: number; // Value in base currency
}

export interface AllocationResult {
  token: string;
  percentage: number;
  value: number;
}

/**
 * Calculate portfolio allocation percentages from token holdings
 * Property 8: Portfolio Allocation Percentage Accuracy
 * 
 * For any set of treasury holdings with token amounts and values,
 * the calculated allocation percentages should sum to 100% (within 0.1% tolerance for rounding),
 * and each token's percentage should equal (token_value / total_value) * 100.
 */
export function calculateAllocation(holdings: TokenHolding[]): AllocationResult[] {
  if (holdings.length === 0) {
    return [];
  }

  // Calculate total value
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);

  if (totalValue === 0) {
    return holdings.map(holding => ({
      token: holding.token,
      percentage: 0,
      value: 0,
    }));
  }

  // Calculate percentages
  const allocations = holdings.map(holding => ({
    token: holding.token,
    percentage: (holding.value / totalValue) * 100,
    value: holding.value,
  }));

  return allocations;
}

/**
 * Validate that allocation percentages sum to 100% within tolerance
 */
export function validateAllocationSum(allocations: AllocationResult[], tolerance: number = 0.1): boolean {
  const sum = allocations.reduce((total, alloc) => total + alloc.percentage, 0);
  return Math.abs(sum - 100) <= tolerance;
}
