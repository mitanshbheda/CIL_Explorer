import { NextResponse } from 'next/server';
import { getNorms, getAnalytics } from '../../../lib/db';

export async function GET() {
  try {
    const norms = await getNorms();
    const analytics = await getAnalytics();

    const totalNorms = norms.length;
    const establishedCount = norms.filter(n => n.status === 'established').length;
    const emergingCount = norms.filter(n => n.status === 'emerging').length;
    const contestedCount = norms.filter(n => n.status === 'contested').length;
    const disputedCount = norms.filter(n => n.contested).length;

    const totalSources = norms.reduce((sum, n) => sum + (n.sources ? n.sources.length : 0), 0);
    const totalPractices = norms.reduce((sum, n) => sum + (n.state_practice ? n.state_practice.length : 0), 0);

    const domainDistribution: Record<string, number> = {};
    norms.forEach(n => {
      domainDistribution[n.domain] = (domainDistribution[n.domain] || 0) + 1;
    });

    const viewsList = Object.entries(analytics.view_logs || {}).map(([id, views]) => {
      const norm = norms.find(n => n.norm_id === id);
      return {
        norm_id: id,
        title: norm ? norm.title : 'Deleted Norm',
        domain: norm ? norm.domain : 'unknown',
        views
      };
    }).sort((a, b) => b.views - a.views).slice(0, 10);

    const searchFreq: Record<string, number> = {};
    (analytics.search_logs || []).forEach(log => {
      if (log.query) {
        const q = log.query.toLowerCase().trim();
        if (q) searchFreq[q] = (searchFreq[q] || 0) + 1;
      }
    });
    
    const topSearches = Object.entries(searchFreq).map(([keyword, count]) => ({
      keyword,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 15);

    return NextResponse.json({
      metrics: {
        totalNorms,
        establishedCount,
        emergingCount,
        contestedCount,
        disputedCount,
        totalSources,
        totalPractices
      },
      domainDistribution,
      mostViewed: viewsList,
      topSearches
    });
  } catch (err) {
    console.error('GET /api/analytics error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
