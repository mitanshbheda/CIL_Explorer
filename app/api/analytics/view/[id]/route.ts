import { NextResponse } from 'next/server';
import { getAnalytics, saveAnalytics } from '../../../../../lib/db';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const normId = id.toUpperCase();

    const analytics = getAnalytics();
    analytics.search_logs = analytics.search_logs || [];
    analytics.view_logs = analytics.view_logs || {};

    analytics.view_logs[normId] = (analytics.view_logs[normId] || 0) + 1;
    saveAnalytics(analytics);

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('POST /api/analytics/view/[id] error:', err);
    return new Response(null, { status: 500 });
  }
}
