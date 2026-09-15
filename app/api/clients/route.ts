import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin, isErrorResponse } from '@/lib/rbac';
import { mapClient, clientStatusFromLabel } from '@/lib/mappers';

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const clients = await prisma.client.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(clients.map(mapClient));
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;

  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      name: body.name ?? 'New Client',
      verticalTags: body.verticals ?? [],
      campaigns: body.campaigns ?? 0,
      reach: body.reach ?? '0',
      engagement: body.engagement ?? '0%',
      leads: body.leads ?? 0,
      conversions: body.conversions ?? 0,
      healthScore: body.score ?? 75,
      status: (clientStatusFromLabel[body.status] as any) ?? 'ACTIVE',
    },
  });
  return NextResponse.json(mapClient(client), { status: 201 });
}
