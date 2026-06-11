import { NextResponse } from 'next/server';
import { getNorms, saveNorms, Norm } from '../../../lib/db';
import { checkAdminSession } from '../../../lib/authHelper';

export async function GET() {
  try {
    const norms = getNorms();
    return NextResponse.json(norms);
  } catch (err) {
    console.error('GET /api/norms error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const newNorm: Norm = await request.json();
    if (!newNorm.norm_id || !newNorm.title || !newNorm.domain) {
      return NextResponse.json({ error: 'Norm ID, Title, and Domain are required.' }, { status: 400 });
    }

    const norms = getNorms();
    if (norms.find(n => n.norm_id.toUpperCase() === newNorm.norm_id.toUpperCase())) {
      return NextResponse.json({ error: `Norm with ID ${newNorm.norm_id} already exists.` }, { status: 400 });
    }

    // Standardize
    newNorm.norm_id = newNorm.norm_id.toUpperCase();
    newNorm.state_practice = newNorm.state_practice || [];
    newNorm.opinio_juris = newNorm.opinio_juris || [];
    newNorm.sources = newNorm.sources || [];
    newNorm.summary = newNorm.summary || '';
    newNorm.contested = !!newNorm.contested;

    norms.push(newNorm);
    saveNorms(norms);

    return NextResponse.json(newNorm, { status: 201 });
  } catch (err) {
    console.error('POST /api/norms error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
