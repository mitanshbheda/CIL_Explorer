import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUsers, saveUsers } from '../../../lib/db';
import { checkAdminSession } from '../../../lib/authHelper';

export async function GET() {
  try {
    const users = getUsers();
    if (users.length > 0) {
      const admin = await checkAdminSession();
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }
    }

    const sanitized = users.map(({ username, role }) => ({ username, role }));
    return NextResponse.json(sanitized);
  } catch (err) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const users = getUsers();
    const admin = await checkAdminSession();
    if (!admin && users.length > 0) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { username, password, role } = await request.json();
    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, password, and role are required.' }, { status: 400 });
    }

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ error: 'User already exists.' }, { status: 400 });
    }

    const newUser = {
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      role
    };

    users.push(newUser);
    saveUsers(users);

    return NextResponse.json({ success: true, user: { username, role } });
  } catch (err) {
    console.error('POST /api/users error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
