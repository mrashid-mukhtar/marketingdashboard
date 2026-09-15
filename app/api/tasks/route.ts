import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, isErrorResponse } from '@/lib/rbac';
import { mapTask, taskStatusFromLabel, priorityFromLabel } from '@/lib/mappers';

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const tasks = await prisma.task.findMany({
    include: { vertical: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(tasks.map(mapTask));
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await req.json();
  if (!body.projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

  const status = (taskStatusFromLabel[body.status] as any) ?? 'TODO';
  const task = await prisma.task.create({
    data: {
      title: body.title ?? 'New Task',
      projectId: body.projectId,
      clientId: body.clientId ?? null,
      verticalId: body.verticalId ?? null,
      assigneeId: body.assigneeId ?? null,
      status,
      priority: (priorityFromLabel[body.priority] as any) ?? 'MEDIUM',
      dueDate: body.due ? new Date(body.due) : null,
      estimatedHours: body.estimated ?? null,
      completedAt: status === 'DONE' ? new Date() : null,
    },
    include: { vertical: true },
  });

  await prisma.taskStatusEvent.create({
    data: { taskId: task.id, fromStatus: null, toStatus: status, changedById: user.id },
  });

  return NextResponse.json(mapTask(task), { status: 201 });
}
