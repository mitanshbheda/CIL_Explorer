import { NextResponse } from 'next/server';
import { getNorms } from '../../../../lib/db';
import { checkAdminSession } from '../../../../lib/authHelper';

export async function GET() {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const norms = getNorms();
    return new NextResponse(JSON.stringify(norms, null, 2), {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="norms_export.json"',
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('GET /api/data/export error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
