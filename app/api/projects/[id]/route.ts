import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin, isErrorResponse } from '@/lib/rbac';
import { mapProject, projectStatusFromLabel, priorityFromLabel } from '@/lib/mappers';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const { id } = await params;

  const body = await req.json();
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.clientId !== undefined) data.clientId = body.clientId;
  if (body.verticalId !== undefined) data.verticalId = body.verticalId;
  if (body.ownerId !== undefined) data.ownerId = body.ownerId;
  if (body.priority !== undefined) data.priority = priorityFromLabel[body.priority] ?? body.priority;
  if (body.due !== undefined) data.dueDate = body.due ? new Date(body.due) : null;

  let newStatus: string | undefined;
  if (body.status !== undefined) {
    newStatus = projectStatusFromLabel[body.status] ?? body.status;
    data.status = newStatus;
  }

  const project = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id },
      data,
      include: { vertical: true, tasks: { select: { status: true } } },
    });
    if (newStatus && newStatus !== existing.status) {
      await tx.projectStatusEvent.create({
        data: { projectId: id, fromStatus: existing.status, toStatus: newStatus as any, changedById: user.id },
      });
    }
    return updated;
  });

  return NextResponse.json(mapProject(project));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
