// PnL calculation utilities

export interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  token: string;
  price: number;
  quantity: number;
  timestamp: number;
}

/**
 * Calculate 24-hour PnL from historical trades
 * Property 1: PnL Calculation Accuracy
 * 
 * For any sequence of historical trades with timestamps, prices, and quantities,
 * calculating the 24-hour PnL should produce a value equal to the sum of
 * (sell_price - buy_price) * quantity for all trades within the 24-hour window.
 */
export function calculate24hPnL(trades: Trade[], currentTimestamp: number): number {
  const twentyFourHoursAgo = currentTimestamp - (24 * 60 * 60 * 1000);
  
  // Filter trades within 24-hour window
  const recentTrades = trades.filter(trade => trade.timestamp >= twentyFourHoursAgo);
  
  // Group trades by token to match buys with sells
  const tradesByToken = new Map<string, Trade[]>();
  recentTrades.forEach(trade => {
    if (!tradesByToken.has(trade.token)) {
      tradesByToken.set(trade.token, []);
    }
    tradesByToken.get(trade.token)!.push(trade);
  });
  
  let totalPnL = 0;
  
  // Calculate PnL for each token
  tradesByToken.forEach((tokenTrades) => {
    const buys = tokenTrades.filter(t => t.type === 'BUY');
    const sells = tokenTrades.filter(t => t.type === 'SELL');
    
    // Simple FIFO matching
    let buyIndex = 0;
    let sellIndex = 0;
    
    while (buyIndex < buys.length && sellIndex < sells.length) {
      const buy = buys[buyIndex];
      const sell = sells[sellIndex];
      
      const matchedQuantity = Math.min(buy.quantity, sell.quantity);
      const pnl = (sell.price - buy.price) * matchedQuantity;
      totalPnL += pnl;
      
      buy.quantity -= matchedQuantity;
      sell.quantity -= matchedQuantity;
      
      if (buy.quantity === 0) buyIndex++;
      if (sell.quantity === 0) sellIndex++;
    }
  });
  
  return totalPnL;
}

/**
 * Calculate PnL for a specific time window
 */
export function calculatePnLForWindow(
  trades: Trade[],
  startTimestamp: number,
  endTimestamp: number
): number {
  const windowTrades = trades.filter(
    trade => trade.timestamp >= startTimestamp && trade.timestamp <= endTimestamp
  );
  
  return calculate24hPnL(windowTrades, endTimestamp);
}
