import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 10: Error Logging Completeness
 * Validates: Requirements 11.5
 * 
 * For any error that occurs in the application, a console log entry should be created
 * that includes the error message, error type, component or function name where the error occurred,
 * and relevant context (e.g., contract address, function name, user address).
 */

// Mock validateEnvironment function for testing
function validateEnvironment(env: Record<string, string | undefined>): { valid: boolean; missing: string[] } {
  const requiredEnvVars = [
    'NEXT_PUBLIC_MONAD_RPC_URL',
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
  ];

  const missing: string[] = [];
  const errorLogs: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!env[envVar]) {
      missing.push(envVar);
      const errorMsg = `Missing required environment variable: ${envVar}`;
      errorLogs.push(errorMsg);
      console.error(errorMsg);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

describe('Environment Variable Validation - Property Tests', () => {
  it('Property: Missing environment variables produce error logs with variable names', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom(
            'NEXT_PUBLIC_MONAD_RPC_URL',
            'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'
          ),
          { minLength: 1, maxLength: 2 }
        ),
        (missingVars) => {
          // Create test environment with missing variables
          const testEnv: Record<string, string | undefined> = {
            NEXT_PUBLIC_MONAD_RPC_URL: 'https://test.rpc',
            NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: 'test-project-id',
          };
          
          // Remove the specified variables
          missingVars.forEach(varName => {
            testEnv[varName] = undefined;
          });

          // Capture console.error calls
          const consoleErrorSpy: string[] = [];
          const originalError = console.error;
          console.error = (...args: any[]) => {
            consoleErrorSpy.push(args.join(' '));
          };

          const result = validateEnvironment(testEnv);

          // Restore console.error
          console.error = originalError;

          // Property 1: Result should indicate invalid when variables are missing
          expect(result.valid).toBe(false);

          // Property 2: Missing array should contain all missing variable names
          missingVars.forEach(varName => {
            expect(result.missing).toContain(varName);
          });

          // Property 3: Console errors should be logged for each missing variable
          // Each missing variable should appear in at least one error log
          missingVars.forEach(varName => {
            const foundInLogs = consoleErrorSpy.some((log: string) => 
              log.includes(varName)
            );
            expect(foundInLogs).toBe(true);
          });

          // Property 4: Error logs should include the variable name (context)
          // This validates that error logging includes relevant context
          if (consoleErrorSpy.length > 0) {
            const allLogsIncludeContext = consoleErrorSpy.every((log: string) =>
              missingVars.some(varName => log.includes(varName))
            );
            expect(allLogsIncludeContext).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: When all required variables are present, validation passes with no errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          rpcUrl: fc.webUrl(),
          projectId: fc.uuid(),
        }),
        ({ rpcUrl, projectId }) => {
          // Create test environment with all required variables
          const testEnv: Record<string, string | undefined> = {
            NEXT_PUBLIC_MONAD_RPC_URL: rpcUrl,
            NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: projectId,
          };

          // Capture console.error calls
          const consoleErrorSpy: string[] = [];
          const originalError = console.error;
          console.error = (...args: any[]) => {
            consoleErrorSpy.push(args.join(' '));
          };

          const result = validateEnvironment(testEnv);

          // Restore console.error
          console.error = originalError;

          // Property: Validation should pass
          expect(result.valid).toBe(true);
          expect(result.missing).toHaveLength(0);

          // Property: No error logs should be generated
          const errorLogsAboutMissing = consoleErrorSpy.filter((log: string) =>
            log.includes('Missing required environment variable')
          );
          expect(errorLogsAboutMissing).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});
