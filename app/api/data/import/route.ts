import { NextResponse } from 'next/server';
import { saveNorms, Norm } from '../../../../lib/db';
import { checkAdminSession } from '../../../../lib/authHelper';

export async function POST(request: Request) {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const importedData = await request.json();
    if (!Array.isArray(importedData)) {
      return NextResponse.json({ error: 'Imported data must be an array of norms.' }, { status: 400 });
    }

    // Basic schema checks
    for (const item of importedData) {
      if (!item.norm_id || !item.title || !item.domain) {
        return NextResponse.json({ error: 'Each imported norm must have norm_id, title, and domain.' }, { status: 400 });
      }
    }

    await saveNorms(importedData as Norm[]);
    return NextResponse.json({ success: true, count: importedData.length });
  } catch (err) {
    console.error('POST /api/data/import error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
