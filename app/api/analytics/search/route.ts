import { NextResponse } from 'next/server';
import { getAnalytics, saveAnalytics } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { query, resultsCount } = await request.json();
    if (!query) {
      return new Response(null, { status: 400 });
    }

    const analytics = getAnalytics();
    analytics.search_logs = analytics.search_logs || [];
    analytics.view_logs = analytics.view_logs || {};

    analytics.search_logs.push({
      query: query.substring(0, 100),
      timestamp: new Date().toISOString(),
      resultsCount: resultsCount || 0
    });

    if (analytics.search_logs.length > 1000) {
      analytics.search_logs.shift();
    }

    saveAnalytics(analytics);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('POST /api/analytics/search error:', err);
    return new Response(null, { status: 500 });
  }
}
