import { useEffect, useState, useCallback, useRef } from 'react';

export interface TradeEvent {
  id: string;
  type: 'BUY' | 'SELL';
  token: string;
  allocation: number;
  confidence: number;
  reasoning: string;
  timestamp: number;
  txHash?: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'failed' | 'stopped';

interface RetryConfig {
  initialDelay: number;
  maxDelay: number;
  maxRetries: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxRetries: 10,
  backoffMultiplier: 2,
};

export function calculateBackoffDelay(
  attemptNumber: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  return Math.min(initialDelay * Math.pow(backoffMultiplier, attemptNumber), maxDelay);
}

export function useWebSocket(url: string, retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedFirstError = useRef(false);

  const connect = useCallback(() => {
    // Don't attempt if already connected or stopped
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Stop attempting after max retries
    if (reconnectAttempts >= retryConfig.maxRetries) {
      setConnectionState('stopped');
      console.error('[WebSocket] Max retries reached. Stopping connection attempts.', {
        totalAttempts: retryConfig.maxRetries,
        url
      });
      return;
    }

    setConnectionState('connecting');
    
    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnectionState('connected');
        setReconnectAttempts(0);
        hasLoggedFirstError.current = false;
        console.log('[WebSocket] Connected successfully to', url);
      };

      socket.onclose = (event) => {
        setConnectionState('disconnected');
        
        // Log appropriately based on attempt number
        if (reconnectAttempts === 0 && !hasLoggedFirstError.current) {
          console.error('[WebSocket] Connection failed:', {
            code: event.code,
            reason: event.reason || 'No reason provided',
            url,
            attempt: 1
          });
          hasLoggedFirstError.current = true;
        } else if (reconnectAttempts > 0) {
          const backoffDelay = calculateBackoffDelay(
            reconnectAttempts,
            retryConfig.initialDelay,
            retryConfig.maxDelay,
            retryConfig.backoffMultiplier
          );
          console.warn('[WebSocket] Retry attempt failed:', {
            attempt: reconnectAttempts + 1,
            nextRetryIn: `${backoffDelay}ms`,
            url
          });
        }
        
        // Don't retry if max retries reached
        if (reconnectAttempts >= retryConfig.maxRetries) {
          setConnectionState('stopped');
          return;
        }
        
        // Exponential backoff reconnection
        const delay = calculateBackoffDelay(
          reconnectAttempts,
          retryConfig.initialDelay,
          retryConfig.maxDelay,
          retryConfig.backoffMultiplier
        );
        setReconnectAttempts(prev => prev + 1);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      socket.onerror = () => {
        // Error details are logged in onclose
        setConnectionState('failed');
      };

      socket.onmessage = (event) => {
        try {
          const tradeEvent: TradeEvent = JSON.parse(event.data);
          setEvents(prev => [tradeEvent, ...prev].slice(0, 50)); // Keep last 50 events
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

    } catch (error) {
      if (!hasLoggedFirstError.current) {
        console.error('[WebSocket] Failed to create connection:', error, { url });
        hasLoggedFirstError.current = true;
      }
      setConnectionState('failed');
    }
  }, [url, reconnectAttempts, retryConfig]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionState('disconnected');
    setReconnectAttempts(0);
    hasLoggedFirstError.current = false;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    hasLoggedFirstError.current = false;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    // Only connect in browser environment
    if (typeof window === 'undefined') return;
    
    // Don't attempt connection if URL is invalid or backend not configured
    if (!url || url === 'ws://localhost:8080' || url.includes('localhost')) {
      console.warn('[WebSocket] Backend not configured or not running. Skipping connection.', { url });
      setConnectionState('stopped');
      return;
    }
    
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect, url]);

  return { 
    events, 
    connectionState, 
    reconnect,
    reconnectAttempts 
  };
}