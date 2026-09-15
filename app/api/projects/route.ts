import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin, isErrorResponse } from '@/lib/rbac';
import { mapProject, projectStatusFromLabel, priorityFromLabel } from '@/lib/mappers';

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const projects = await prisma.project.findMany({
    include: { vertical: true, tasks: { select: { status: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(projects.map(mapProject));
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;

  const body = await req.json();
  if (!body.clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name: body.name ?? 'New Project',
      clientId: body.clientId,
      verticalId: body.verticalId ?? null,
      ownerId: body.ownerId ?? null,
      status: (projectStatusFromLabel[body.status] as any) ?? 'PLANNING',
      priority: (priorityFromLabel[body.priority] as any) ?? 'MEDIUM',
      dueDate: body.due ? new Date(body.due) : null,
    },
    include: { vertical: true, tasks: { select: { status: true } } },
  });
  return NextResponse.json(mapProject(project), { status: 201 });
}
