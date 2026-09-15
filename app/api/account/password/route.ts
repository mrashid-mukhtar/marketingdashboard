import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireUser, isErrorResponse } from '@/lib/rbac';

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const body = await req.json();
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record || !(await bcrypt.compare(currentPassword, record.passwordHash))) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
  return NextResponse.json({ ok: true });
}