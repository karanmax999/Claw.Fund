// Environment variable validation
const requiredEnvVars = [
  'NEXT_PUBLIC_MONAD_RPC_URL',
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_WS_URL',
  'NEXT_PUBLIC_ENABLE_DEMO_MODE',
] as const;

export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
      console.error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Validate on module load (client-side only)
if (typeof window !== 'undefined') {
  const { valid, missing } = validateEnvironment();
  if (!valid) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'See .env.local.example for reference.'
    );
  }
}

export const env = {
  MONAD_RPC_URL: process.env.NEXT_PUBLIC_MONAD_RPC_URL || '',
  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
  ENABLE_DEMO_MODE: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true',
};
