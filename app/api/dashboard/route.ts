import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, isErrorResponse } from '@/lib/rbac';
import { mapClient, mapProject, mapTask, mapProposal } from '@/lib/mappers';
import { getTeamKpis, getVerticalKpis, getDashboardSummary, dailyLabels } from '@/lib/kpi';

export async function GET(req: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;
  const params = new URL(req.url).searchParams;
  const start = params.get('start');
  const end = params.get('end');
  const dueDate = start && end ? { gte: new Date(`${start}T00:00:00.000Z`), lte: new Date(`${end}T23:59:59.999Z`) } : undefined;

  const [clients, projects, tasks, proposals, team, verticals, summary] = await Promise.all([
    prisma.client.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.project.findMany({ include: { vertical: true, tasks: { select: { status: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.task.findMany({ where: dueDate ? { dueDate } : undefined, include: { vertical: true }, orderBy: { createdAt: 'asc' } }),
    prisma.proposal.findMany({ orderBy: { createdAt: 'asc' } }),
    getTeamKpis(),
    getVerticalKpis(),
    getDashboardSummary(),
  ]);

  const clientProjects = new Map<string, string[]>();
  for (const project of projects) {
    const verticalName = project.vertical?.name;
    if (!verticalName) continue;
    const existing = clientProjects.get(project.clientId) ?? [];
    if (!existing.includes(verticalName)) existing.push(verticalName);
    clientProjects.set(project.clientId, existing);
  }

  const range = { start, end };
  const rangeSummary = { ...summary, totalAssigned: tasks.length, totalCompleted: tasks.filter((task) => task.status === 'DONE').length };
  return NextResponse.json({
    clients: clients.map((client) => ({ ...mapClient(client), verticals: clientProjects.get(client.id) ?? [] })),
    projects: projects.map(mapProject),
    tasks: tasks.map(mapTask),
    proposals: proposals.map(mapProposal),
    team,
    verticals,
    dailyLabels,
    summary: rangeSummary,
    currentUser: { id: user.id, name: user.name, role: user.role, avatarUrl: (team.find((member) => member.id === user.id) as any)?.avatarUrl ?? null },
    range,
  });
}
