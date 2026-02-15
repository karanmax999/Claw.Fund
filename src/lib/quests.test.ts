import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 6: Quest Eligibility Filtering
 * Validates: Requirements 5.5
 * 
 * For any set of quests and a connected user address,
 * the filtered quest list should contain only quests where the user address
 * is not in the completedBy array and the quest isActive flag is true.
 */

interface Quest {
  id: bigint;
  description: string;
  reward: bigint;
  active: boolean;
  completedBy: `0x${string}`[];
}

function filterEligibleQuests(quests: Quest[], userAddress: `0x${string}` | undefined): Quest[] {
  if (!userAddress) {
    return [];
  }

  return quests.filter(quest => {
    // Quest must be active
    if (!quest.active) {
      return false;
    }

    // User must not have completed the quest
    if (quest.completedBy.includes(userAddress)) {
      return false;
    }

    return true;
  });
}

function generateMockAddress(seed: number): `0x${string}` {
  const hex = seed.toString(16).padStart(40, '0');
  return `0x${hex}` as `0x${string}`;
}

describe('Quest Eligibility - Property Tests', () => {
  it('Property: Filtered quests exclude completed and inactive quests', () => {
    fc.assert(
      fc.property(
        fc.record({
          userAddress: fc.integer({ min: 1, max: 1000 }).map(generateMockAddress),
          quests: fc.array(
            fc.record({
              id: fc.bigInt({ min: 1n, max: 1000n }),
              description: fc.string({ minLength: 10, maxLength: 100 }),
              reward: fc.bigInt({ min: 1n, max: 10000n }),
              active: fc.boolean(),
              completedBy: fc.array(
                fc.integer({ min: 1, max: 1000 }).map(generateMockAddress),
                { maxLength: 10 }
              ),
            }),
            { minLength: 0, maxLength: 20 }
          ),
        }),
        ({ userAddress, quests }) => {
          const eligibleQuests = filterEligibleQuests(quests, userAddress);

          // Property 1: All eligible quests must be active
          eligibleQuests.forEach(quest => {
            expect(quest.active).toBe(true);
          });

          // Property 2: User should not be in completedBy array for any eligible quest
          eligibleQuests.forEach(quest => {
            expect(quest.completedBy).not.toContain(userAddress);
          });

          // Property 3: Eligible quests should be a subset of all quests
          expect(eligibleQuests.length).toBeLessThanOrEqual(quests.length);

          // Property 4: All eligible quests should exist in original quest list
          eligibleQuests.forEach(eligibleQuest => {
            const exists = quests.some(quest => quest.id === eligibleQuest.id);
            expect(exists).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: No user address returns empty quest list', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.bigInt({ min: 1n, max: 1000n }),
            description: fc.string({ minLength: 10, maxLength: 100 }),
            reward: fc.bigInt({ min: 1n, max: 10000n }),
            active: fc.boolean(),
            completedBy: fc.array(
              fc.integer({ min: 1, max: 1000 }).map(generateMockAddress),
              { maxLength: 10 }
            ),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (quests) => {
          const eligibleQuests = filterEligibleQuests(quests, undefined);

          // Property: No user address should result in empty list
          expect(eligibleQuests).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: All inactive quests are filtered out', () => {
    fc.assert(
      fc.property(
        fc.record({
          userAddress: fc.integer({ min: 1, max: 1000 }).map(generateMockAddress),
          quests: fc.array(
            fc.record({
              id: fc.bigInt({ min: 1n, max: 1000n }),
              description: fc.string({ minLength: 10, maxLength: 100 }),
              reward: fc.bigInt({ min: 1n, max: 10000n }),
              active: fc.constant(false), // All quests inactive
              completedBy: fc.array(
                fc.integer({ min: 1, max: 1000 }).map(generateMockAddress),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        ({ userAddress, quests }) => {
          const eligibleQuests = filterEligibleQuests(quests, userAddress);

          // Property: No quests should be eligible if all are inactive
          expect(eligibleQuests).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: User who completed all quests gets empty list', () => {
    fc.assert(
      fc.property(
        fc.record({
          userAddress: fc.integer({ min: 1, max: 1000 }).map(generateMockAddress),
          quests: fc.array(
            fc.record({
              id: fc.bigInt({ min: 1n, max: 1000n }),
              description: fc.string({ minLength: 10, maxLength: 100 }),
              reward: fc.bigInt({ min: 1n, max: 10000n }),
              active: fc.constant(true), // All quests active
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        ({ userAddress, quests }) => {
          // Add user to completedBy array for all quests
          const questsWithUserCompleted = quests.map(quest => ({
            ...quest,
            completedBy: [userAddress],
          }));

          const eligibleQuests = filterEligibleQuests(questsWithUserCompleted, userAddress);

          // Property: No quests should be eligible if user completed all
          expect(eligibleQuests).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Active quests not completed by user are eligible', () => {
    fc.assert(
      fc.property(
        fc.record({
          userAddress: fc.integer({ min: 1, max: 1000 }).map(generateMockAddress),
          otherUsers: fc.array(
            fc.integer({ min: 2000, max: 3000 }).map(generateMockAddress),
            { minLength: 1, maxLength: 5 }
          ),
          questCount: fc.integer({ min: 1, max: 10 }),
        }),
        ({ userAddress, otherUsers, questCount }) => {
          // Create quests that are active and completed only by other users
          const quests: Quest[] = Array.from({ length: questCount }, (_, i) => ({
            id: BigInt(i + 1),
            description: `Quest ${i + 1}`,
            reward: BigInt((i + 1) * 100),
            active: true,
            completedBy: otherUsers, // Only other users completed these
          }));

          const eligibleQuests = filterEligibleQuests(quests, userAddress);

          // Property: All quests should be eligible (active and not completed by user)
          expect(eligibleQuests).toHaveLength(questCount);

          // Property: All returned quests should be the original quests
          eligibleQuests.forEach((quest, index) => {
            expect(quest.id).toBe(BigInt(index + 1));
            expect(quest.active).toBe(true);
            expect(quest.completedBy).not.toContain(userAddress);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Quest filtering is deterministic', () => {
    fc.assert(
      fc.property(
        fc.record({
          userAddress: fc.integer({ min: 1, max: 1000 }).map(generateMockAddress),
          quests: fc.array(
            fc.record({
              id: fc.bigInt({ min: 1n, max: 1000n }),
              description: fc.string({ minLength: 10, maxLength: 100 }),
              reward: fc.bigInt({ min: 1n, max: 10000n }),
              active: fc.boolean(),
              completedBy: fc.array(
                fc.integer({ min: 1, max: 1000 }).map(generateMockAddress),
                { maxLength: 10 }
              ),
            }),
            { minLength: 0, maxLength: 20 }
          ),
        }),
        ({ userAddress, quests }) => {
          const eligibleQuests1 = filterEligibleQuests(quests, userAddress);
          const eligibleQuests2 = filterEligibleQuests(quests, userAddress);

          // Property: Same input should produce same output
          expect(eligibleQuests1).toEqual(eligibleQuests2);
          expect(eligibleQuests1.length).toBe(eligibleQuests2.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});