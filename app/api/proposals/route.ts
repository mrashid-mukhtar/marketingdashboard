import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, isErrorResponse } from '@/lib/rbac';
import { mapProposal, proposalStatusFromLabel } from '@/lib/mappers';

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const proposals = await prisma.proposal.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(proposals.map(mapProposal));
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await req.json();
  const proposal = await prisma.proposal.create({
    data: {
      clientId: body.clientId ?? null,
      clientName: body.client ?? 'New Client',
      service: body.service ?? '',
      status: (proposalStatusFromLabel[body.status] as any) ?? 'DRAFT',
      value: body.value ?? 0,
      nextStep: body.next ?? null,
    },
  });
  return NextResponse.json(mapProposal(proposal), { status: 201 });
}
