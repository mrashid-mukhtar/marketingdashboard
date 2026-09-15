import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, isErrorResponse } from '@/lib/rbac';

const MAX_AVATAR_LENGTH = 3_000_000;

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await req.json();
  const data: { name?: string; jobTitle?: string | null; avatarUrl?: string | null } = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    data.name = name;
  }
  if (body.jobTitle !== undefined) data.jobTitle = body.jobTitle ? String(body.jobTitle).trim() : null;
  if (body.avatarUrl !== undefined) {
    const avatarUrl = body.avatarUrl ? String(body.avatarUrl) : null;
    if (avatarUrl && (!avatarUrl.startsWith('data:image/') || avatarUrl.length > MAX_AVATAR_LENGTH)) {
      return NextResponse.json({ error: 'Image must be a data image under 2 MB' }, { status: 400 });
    }
    data.avatarUrl = avatarUrl;
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ id: updated.id, name: updated.name, jobTitle: updated.jobTitle, avatarUrl: updated.avatarUrl });
}