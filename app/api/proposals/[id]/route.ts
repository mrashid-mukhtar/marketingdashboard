import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin, isErrorResponse } from '@/lib/rbac';
import { mapProposal, proposalStatusFromLabel } from '@/lib/mappers';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;
  const { id } = await params;

  const body = await req.json();
  const data: any = {};
  if (body.client !== undefined) data.clientName = body.client;
  if (body.clientId !== undefined) data.clientId = body.clientId;
  if (body.service !== undefined) data.service = body.service;
  if (body.value !== undefined) data.value = body.value;
  if (body.next !== undefined) data.nextStep = body.next;
  if (body.status !== undefined) data.status = proposalStatusFromLabel[body.status] ?? body.status;

  const proposal = await prisma.proposal.update({ where: { id }, data });
  return NextResponse.json(mapProposal(proposal));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;
  const { id } = await params;
  await prisma.proposal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
