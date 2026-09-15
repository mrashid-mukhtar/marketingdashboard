import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export type SessionUser = { id: string; email: string; name: string; role: 'ADMIN' | 'MEMBER' };

/** Returns the logged-in user, or null if there is no session. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/** Use at the top of a route handler. Returns a 401 response to short-circuit, or the user. */
export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return user;
}

/** Use at the top of a route handler for admin-only actions. Returns 401/403, or the user. */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  return user;
}

export function isErrorResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}
