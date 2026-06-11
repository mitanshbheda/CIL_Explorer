import { NextResponse } from 'next/server';
import { getUsers, saveUsers } from '../../../../lib/db';
import { checkAdminSession } from '../../../../lib/authHelper';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { username } = await context.params;
    if (username.toLowerCase() === 'admin') {
      return NextResponse.json({ error: 'Cannot delete the master admin account.' }, { status: 400 });
    }

    let users = getUsers();
    const initialLen = users.length;
    users = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());

    if (users.length === initialLen) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    saveUsers(users);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/users/[username] error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
