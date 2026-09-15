import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, isErrorResponse } from '@/lib/rbac';
import { mapClient, mapProject, mapTask, mapProposal } from '@/lib/mappers';
import { getTeamKpis, getVerticalKpis, getDashboardSummary, dailyLabels } from '@/lib/kpi';

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const [clients, projects, tasks, proposals, team, verticals, summary] = await Promise.all([
    prisma.client.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.project.findMany({ include: { vertical: true, tasks: { select: { status: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.task.findMany({ include: { vertical: true }, orderBy: { createdAt: 'asc' } }),
    prisma.proposal.findMany({ orderBy: { createdAt: 'asc' } }),
    getTeamKpis(),
    getVerticalKpis(),
    getDashboardSummary(),
  ]);

  return NextResponse.json({
    clients: clients.map(mapClient),
    projects: projects.map(mapProject),
    tasks: tasks.map(mapTask),
    proposals: proposals.map(mapProposal),
    team,
    verticals,
    dailyLabels,
    summary,
    currentUser: { id: user.id, name: user.name, role: user.role, avatarUrl: (team.find((member) => member.id === user.id) as any)?.avatarUrl ?? null },
  });
}
