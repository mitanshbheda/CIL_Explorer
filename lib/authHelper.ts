import { cookies } from 'next/headers';

export async function checkAdminSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie || !sessionCookie.value) return null;
    
    const user = JSON.parse(sessionCookie.value);
    if (user && (user.role === 'admin' || user.role === 'moderator')) {
      return user;
    }
    return null;
  } catch (err) {
    return null;
  }
}
