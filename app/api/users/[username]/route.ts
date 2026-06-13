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
    let users = getUsers();
    const userToDelete = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (userToDelete.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last remaining administrator account.' }, { status: 400 });
      }
    }

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
