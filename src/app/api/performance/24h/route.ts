import { NextResponse } from 'next/server';

// Mock data for now - will be replaced with actual backend database query
// In production, this would query the SQLite database from the backend
export async function GET() {
  try {
    // TODO: Query backend SQLite database for trades in last 24 hours
    // For now, return mock data
    const mockPnL = {
      value: 124.59, // PnL in MON
      delta: 3.2, // Percentage change
      timestamp: Date.now(),
    };

    return NextResponse.json(mockPnL);
  } catch (error) {
    console.error('Error fetching 24h PnL:', error);
    return NextResponse.json(
      { error: 'Failed to fetch 24h PnL' },
      { status: 500 }
    );
  }
}
