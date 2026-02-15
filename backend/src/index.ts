import { startAgentLoop } from "./agent/agentLoop";
import { startWsServer } from "./ws/wsServer";
import { log } from "./logger/reasoningLogger";

async function main(): Promise<void> {
  try {
    // Start WebSocket server for real-time frontend updates
    startWsServer(8080);

    await startAgentLoop();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Fatal: ${msg}`);
    process.exit(1);
  }
}

main();
