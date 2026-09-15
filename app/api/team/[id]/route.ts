import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/rbac';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;
  const { id } = await params;

  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.jobTitle !== undefined) data.jobTitle = body.jobTitle;
  if (body.verticals !== undefined) data.verticalTags = body.verticals;
  if (body.role !== undefined) data.role = body.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
  if (body.active !== undefined) data.active = !!body.active;

  const updated = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id, name: updated.name, role: updated.role, active: updated.active });
}

// Deactivates rather than hard-deletes, to preserve historical task/project references.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  await prisma.user.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
