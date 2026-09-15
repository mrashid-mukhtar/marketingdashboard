import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin, isErrorResponse } from '@/lib/rbac';
import { mapTask, taskStatusFromLabel, priorityFromLabel } from '@/lib/mappers';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  if (user.role !== 'ADMIN' && Object.keys(body).some((key) => key !== 'status')) {
    return NextResponse.json({ error: 'Members may only update task status' }, { status: 403 });
  }
  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId; // reassign / "assign work"
  if (body.verticalId !== undefined) data.verticalId = body.verticalId;
  if (body.priority !== undefined) data.priority = priorityFromLabel[body.priority] ?? body.priority;
  if (body.due !== undefined) data.dueDate = body.due ? new Date(body.due) : null;
  if (body.estimated !== undefined) data.estimatedHours = body.estimated;
  if (body.qualityScore !== undefined) data.qualityScore = body.qualityScore;

  let newStatus: string | undefined;
  if (body.status !== undefined) {
    newStatus = taskStatusFromLabel[body.status] ?? body.status;
    data.status = newStatus;
    data.completedAt = newStatus === 'DONE' ? new Date() : null;
  }

  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({ where: { id }, data, include: { vertical: true } });
    if (newStatus && newStatus !== existing.status) {
      await tx.taskStatusEvent.create({
        data: { taskId: id, fromStatus: existing.status, toStatus: newStatus as any, changedById: user.id },
      });
    }
    return updated;
  });

  return NextResponse.json(mapTask(task));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
