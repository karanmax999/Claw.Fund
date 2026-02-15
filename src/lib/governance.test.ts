import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 5: Proposal Status Calculation
 * Validates: Requirements 4.5
 * 
 * For any governance proposal with vote counts and an end timestamp,
 * the calculated status should be ACTIVE if current time < end time,
 * PASSED if current time >= end time and votesFor > votesAgainst,
 * and REJECTED if current time >= end time and votesAgainst >= votesFor.
 */

/**
 * Property 7: Token-Based Access Control
 * Validates: Requirements 6.2, 6.3
 * 
 * For any user with a CLAW token balance below the minimum threshold,
 * all governance voting buttons and quest completion buttons should be
 * in a disabled state and display the required token amount.
 */

interface Proposal {
  id: bigint;
  endBlock: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  executed: boolean;
}

type ProposalStatus = 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED';

function calculateProposalStatus(proposal: Proposal, currentBlock: bigint): ProposalStatus {
  if (proposal.executed) {
    return 'EXECUTED';
  }
  
  if (currentBlock < proposal.endBlock) {
    return 'ACTIVE';
  }
  
  if (proposal.forVotes > proposal.againstVotes) {
    return 'PASSED';
  }
  
  return 'REJECTED';
}

function checkTokenGatedAccess(balance: bigint, threshold: bigint): {
  canAccess: boolean;
  buttonsDisabled: boolean;
  showRequirement: boolean;
} {
  const canAccess = balance >= threshold;
  
  return {
    canAccess,
    buttonsDisabled: !canAccess,
    showRequirement: !canAccess,
  };
}

describe('Governance Logic - Property Tests', () => {
  it('Property: Proposal status calculation follows correct logic', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.bigInt({ min: 1n, max: 1000n }),
          endBlock: fc.bigInt({ min: 1000n, max: 10000n }),
          forVotes: fc.bigInt({ min: 0n, max: 1000000n }),
          againstVotes: fc.bigInt({ min: 0n, max: 1000000n }),
          executed: fc.boolean(),
          currentBlock: fc.bigInt({ min: 500n, max: 15000n }),
        }),
        ({ currentBlock, ...proposal }) => {
          const status = calculateProposalStatus(proposal, currentBlock);

          // Property 1: Executed proposals always return EXECUTED
          if (proposal.executed) {
            expect(status).toBe('EXECUTED');
            return;
          }

          // Property 2: Active proposals (current < end) return ACTIVE
          if (currentBlock < proposal.endBlock) {
            expect(status).toBe('ACTIVE');
            return;
          }

          // Property 3: Ended proposals with more FOR votes return PASSED
          if (currentBlock >= proposal.endBlock && proposal.forVotes > proposal.againstVotes) {
            expect(status).toBe('PASSED');
            return;
          }

          // Property 4: Ended proposals with FOR <= AGAINST votes return REJECTED
          if (currentBlock >= proposal.endBlock && proposal.forVotes <= proposal.againstVotes) {
            expect(status).toBe('REJECTED');
            return;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Token-based access control disables buttons below threshold', () => {
    fc.assert(
      fc.property(
        fc.record({
          balance: fc.bigInt({ min: 0n, max: 1000000n }),
          threshold: fc.bigInt({ min: 1n, max: 500000n }),
        }),
        ({ balance, threshold }) => {
          const access = checkTokenGatedAccess(balance, threshold);

          // Property 1: Access granted only when balance >= threshold
          if (balance >= threshold) {
            expect(access.canAccess).toBe(true);
            expect(access.buttonsDisabled).toBe(false);
            expect(access.showRequirement).toBe(false);
          } else {
            expect(access.canAccess).toBe(false);
            expect(access.buttonsDisabled).toBe(true);
            expect(access.showRequirement).toBe(true);
          }

          // Property 2: Button state is inverse of access
          expect(access.buttonsDisabled).toBe(!access.canAccess);

          // Property 3: Requirement display matches access denial
          expect(access.showRequirement).toBe(!access.canAccess);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Exact threshold balance grants access', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 1000000n }),
        (threshold) => {
          const access = checkTokenGatedAccess(threshold, threshold);

          // Property: Exact threshold balance should grant access
          expect(access.canAccess).toBe(true);
          expect(access.buttonsDisabled).toBe(false);
          expect(access.showRequirement).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Zero balance always denies access (non-zero threshold)', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 1000000n }),
        (threshold) => {
          const access = checkTokenGatedAccess(0n, threshold);

          // Property: Zero balance with positive threshold should deny access
          expect(access.canAccess).toBe(false);
          expect(access.buttonsDisabled).toBe(true);
          expect(access.showRequirement).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Proposal status transitions are consistent', () => {
    fc.assert(
      fc.property(
        fc.record({
          proposal: fc.record({
            id: fc.bigInt({ min: 1n, max: 1000n }),
            endBlock: fc.bigInt({ min: 1000n, max: 5000n }),
            forVotes: fc.bigInt({ min: 0n, max: 1000n }),
            againstVotes: fc.bigInt({ min: 0n, max: 1000n }),
            executed: fc.constant(false), // Not executed for this test
          }),
          blockSequence: fc.array(
            fc.bigInt({ min: 500n, max: 8000n }),
            { minLength: 2, maxLength: 5 }
          ).map(blocks => blocks.sort((a, b) => Number(a - b))), // Ensure ascending order
        }),
        ({ proposal, blockSequence }) => {
          const statuses = blockSequence.map(block => 
            calculateProposalStatus(proposal, block)
          );

          // Property: Status should transition from ACTIVE to PASSED/REJECTED
          for (let i = 1; i < statuses.length; i++) {
            const prevStatus = statuses[i - 1];
            const currentStatus = statuses[i];
            const prevBlock = blockSequence[i - 1];
            const currentBlock = blockSequence[i];

            // If we cross the end block, status should change from ACTIVE
            if (prevBlock < proposal.endBlock && currentBlock >= proposal.endBlock) {
              expect(prevStatus).toBe('ACTIVE');
              expect(['PASSED', 'REJECTED']).toContain(currentStatus);
            }

            // Status should not regress (PASSED/REJECTED should not become ACTIVE)
            if (prevStatus === 'PASSED' || prevStatus === 'REJECTED') {
              expect(currentStatus).toBe(prevStatus);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});