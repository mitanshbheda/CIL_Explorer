import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getUsers } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required.' }, { status: 400 });
    }

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      const sessionUser = { username: user.username, role: user.role };
      const cookieStore = await cookies();
      
      cookieStore.set('session', JSON.stringify(sessionUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/'
      });

      return NextResponse.json({ success: true, user: sessionUser });
    }

    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
