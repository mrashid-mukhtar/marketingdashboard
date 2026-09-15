import { NextResponse } from 'next/server';
import { requireUser, isErrorResponse } from '@/lib/rbac';
import { getHistoricalKpis } from '@/lib/kpi';

// GET /api/kpis?days=30&userId=xyz
export async function GET(req: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(req.url);
  const days = Math.min(Math.max(Number(searchParams.get('days')) || 30, 1), 365);
  const requestedUserId = searchParams.get('userId') || undefined;
  if (requestedUserId && requestedUserId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const series = await getHistoricalKpis(days, requestedUserId);
  return NextResponse.json(series);
}
