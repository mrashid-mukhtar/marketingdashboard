import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin, isErrorResponse } from '@/lib/rbac';
import { getTeamKpis } from '@/lib/kpi';

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const team = await getTeamKpis();
  return NextResponse.json(team);
}

// Admin-only: provision a new team member login.
export async function POST(req: Request) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;

  const body = await req.json();
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 });
  }

  const email = String(body.email).toLowerCase().trim();
  const passwordHash = await bcrypt.hash(body.password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.active) {
    return NextResponse.json({ error: 'A team member with this email already exists' }, { status: 409 });
  }

  const created = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: body.name,
          passwordHash,
          role: body.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
          jobTitle: body.jobTitle ?? null,
          verticalTags: body.verticals ?? [],
          avatarUrl: body.avatarUrl ?? null,
          active: true,
        },
      })
    : await prisma.user.create({
        data: {
          name: body.name,
          email,
          passwordHash,
          role: body.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
          jobTitle: body.jobTitle ?? null,
          verticalTags: body.verticals ?? [],
          avatarUrl: body.avatarUrl ?? null,
        },
      });

  return NextResponse.json({ id: created.id, name: created.name, email: created.email, role: created.role }, { status: existing ? 200 : 201 });
}
