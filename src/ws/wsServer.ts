import { WebSocketServer, WebSocket } from "ws";
import { log } from "../logger/reasoningLogger";

// ─── Event types ─────────────────────────────────────────────────

export const WsEventType = {
  DECISION: "DECISION",
  TRADE_EXECUTED: "TRADE_EXECUTED",
  PORTFOLIO_UPDATE: "PORTFOLIO_UPDATE",
} as const;

export type WsEventType = (typeof WsEventType)[keyof typeof WsEventType];

export interface WsEvent {
  type: WsEventType;
  timestamp: number;
  [key: string]: unknown;
}

// ─── Server singleton ────────────────────────────────────────────

let wss: WebSocketServer | null = null;

/**
 * Start the WebSocket server on the given port.
 * Safe to call multiple times — only the first call creates the server.
 */
export function startWsServer(port: number = 8080): WebSocketServer {
  if (wss) return wss;

  wss = new WebSocketServer({ port });

  wss.on("listening", () => {
    log.info(`[WS] WebSocket server listening on ws://localhost:${port}`);
  });

  wss.on("connection", (socket, req) => {
    const addr = req.socket.remoteAddress ?? "unknown";
    log.info(`[WS] Client connected from ${addr} (total: ${wss!.clients.size})`);

    socket.on("close", () => {
      log.info(`[WS] Client disconnected (remaining: ${wss!.clients.size})`);
    });

    socket.on("error", (err) => {
      log.error(`[WS] Socket error: ${err.message}`);
    });
  });

  wss.on("error", (err) => {
    log.error(`[WS] Server error: ${err.message}`);
  });

  return wss;
}

/**
 * Broadcast a JSON event to every connected client.
 * Silently skips clients that are not in OPEN state.
 */
export function broadcast(event: WsEvent): void {
  if (!wss) return;

  const payload = JSON.stringify(event);
  let sent = 0;

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      sent++;
    }
  }

  log.debug(`[WS] Broadcast ${event.type} → ${sent} client(s)`);
}
