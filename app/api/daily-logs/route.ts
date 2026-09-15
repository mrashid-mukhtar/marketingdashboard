import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, isErrorResponse } from '@/lib/rbac';

// GET /api/daily-logs            -> your own logs (last 30 by default)
// GET /api/daily-logs?userId=xyz -> admin viewing someone else's logs
export async function GET(req: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get('userId');
  if (requestedUserId && requestedUserId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const logs = await prisma.dailyLog.findMany({
    where: { userId: requestedUserId ?? user.id },
    orderBy: { date: 'desc' },
    take: 30,
  });
  return NextResponse.json(logs);
}

// POST body: { date?: 'YYYY-MM-DD', tasksCompleted, hoursLogged, notes? }
// Records (or updates) the caller's own daily work log for that day.
export async function POST(req: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await req.json();
  const date = body.date ? new Date(body.date) : new Date();
  date.setHours(0, 0, 0, 0);

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date } },
    update: {
      tasksCompleted: body.tasksCompleted ?? 0,
      hoursLogged: body.hoursLogged ?? 0,
      notes: body.notes ?? null,
    },
    create: {
      userId: user.id,
      date,
      tasksCompleted: body.tasksCompleted ?? 0,
      hoursLogged: body.hoursLogged ?? 0,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
