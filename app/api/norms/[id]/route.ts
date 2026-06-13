import { NextResponse } from 'next/server';
import { getNorms, saveNorms, Norm } from '../../../../lib/db';
import { checkAdminSession } from '../../../../lib/authHelper';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;
    const normId = id.toUpperCase();
    const updatedNorm: Norm = await request.json();

    const norms = await getNorms();
    const idx = norms.findIndex(n => n.norm_id.toUpperCase() === normId);
    if (idx === -1) {
      return NextResponse.json({ error: `Norm with ID ${normId} not found.` }, { status: 404 });
    }

    // Standardize
    updatedNorm.norm_id = normId;
    updatedNorm.state_practice = updatedNorm.state_practice || [];
    updatedNorm.opinio_juris = updatedNorm.opinio_juris || [];
    updatedNorm.sources = updatedNorm.sources || [];
    updatedNorm.summary = updatedNorm.summary || '';
    updatedNorm.contested = !!updatedNorm.contested;

    norms[idx] = updatedNorm;
    await saveNorms(norms);

    return NextResponse.json(updatedNorm);
  } catch (err) {
    console.error('PUT /api/norms/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;
    const normId = id.toUpperCase();

    let norms = await getNorms();
    const initialLen = norms.length;
    norms = norms.filter(n => n.norm_id.toUpperCase() !== normId);
    
    if (norms.length === initialLen) {
      return NextResponse.json({ error: `Norm with ID ${normId} not found.` }, { status: 404 });
    }

    await saveNorms(norms);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/norms/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
