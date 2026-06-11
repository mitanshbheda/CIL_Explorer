import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Logout API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
