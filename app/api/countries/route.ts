import { NextResponse } from 'next/server';
import { getNorms } from '../../../lib/db';
import { COUNTRY_METADATA } from '../../../lib/countryMetadata';

export async function GET() {
  try {
    const norms = await getNorms();
    const countriesMap: Record<string, any> = {};

    norms.forEach(norm => {
      norm.state_practice.forEach(sp => {
        if (sp.states_involved && Array.isArray(sp.states_involved)) {
          sp.states_involved.forEach(stateName => {
            if (!stateName) return;
            if (!countriesMap[stateName]) {
              const meta = COUNTRY_METADATA[stateName] || {
                region: "Global / Other",
                trade_bloc: "None",
                authority: "National Customs / Legal Authority",
                industry: "General Jurisprudence"
              };
              countriesMap[stateName] = {
                name: stateName,
                region: meta.region,
                trade_bloc: meta.trade_bloc,
                authority: meta.authority,
                industry: meta.industry,
                practice_count: 0,
                domain_count: new Set<string>(),
                norms: []
              };
            }
            countriesMap[stateName].practice_count++;
            countriesMap[stateName].domain_count.add(norm.domain);
            if (!countriesMap[stateName].norms.some((n: any) => n.norm_id === norm.norm_id)) {
              countriesMap[stateName].norms.push({
                norm_id: norm.norm_id,
                title: norm.title,
                domain: norm.domain,
                status: norm.status
              });
            }
          });
        }
      });
    });

    const list = Object.values(countriesMap).map(c => {
      c.domain_count = c.domain_count.size;
      return c;
    });

    list.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/countries error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
