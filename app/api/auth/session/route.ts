import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ loggedIn: false });
    }

    const user = JSON.parse(sessionCookie.value);
    return NextResponse.json({ loggedIn: true, user });
  } catch (err) {
    console.error('Session API error:', err);
    return NextResponse.json({ loggedIn: false });
  }
}
