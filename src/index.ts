import { startAgentLoop } from "./agent/agentLoop";
import { log } from "./logger/reasoningLogger";

async function main(): Promise<void> {
  try {
    await startAgentLoop();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Fatal: ${msg}`);
    process.exit(1);
  }
}

main();
