import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/rbac';
import { mapClient, clientStatusFromLabel } from '@/lib/mappers';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;
  const { id } = await params;

  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.verticals !== undefined) data.verticalTags = body.verticals;
  if (body.campaigns !== undefined) data.campaigns = body.campaigns;
  if (body.reach !== undefined) data.reach = body.reach;
  if (body.engagement !== undefined) data.engagement = body.engagement;
  if (body.leads !== undefined) data.leads = body.leads;
  if (body.conversions !== undefined) data.conversions = body.conversions;
  if (body.score !== undefined) data.healthScore = body.score;
  if (body.status !== undefined) data.status = clientStatusFromLabel[body.status] ?? body.status;

  const client = await prisma.client.update({ where: { id }, data });
  return NextResponse.json(mapClient(client));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
