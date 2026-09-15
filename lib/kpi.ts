import { prisma } from '@/lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;
export const dailyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Per team member: workload, completion, on-time rate, quality, and last-7-day activity. */
export async function getTeamKpis() {
  const users = await prisma.user.findMany({
    where: { active: true },
    include: {
      assignedTasks: true,
      ownedProjects: { select: { id: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const today = startOfDay(new Date());
  const sevenDaysAgo = new Date(today.getTime() - 6 * DAY_MS);
  const logs = await prisma.dailyLog.findMany({
    where: { date: { gte: sevenDaysAgo } },
  });

  return users.map((u) => {
    const tasks = u.assignedTasks;
    const completed = tasks.filter((t) => t.status === 'DONE');
    const onTimeCompleted = completed.filter((t) => !t.dueDate || (t.completedAt && t.completedAt <= t.dueDate));
    const qualityScores = completed.map((t) => t.qualityScore).filter((q): q is number => q != null);
    const avgQuality = qualityScores.length ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 4.2;
    const onTimeRate = pct(onTimeCompleted.length, completed.length || 1);
    const completionRate = pct(completed.length, tasks.length || 1);
    const score = Math.round(onTimeRate * 0.4 + (avgQuality / 5) * 100 * 0.4 + completionRate * 0.2);

    const projectIds = new Set<string>([...u.ownedProjects.map((p) => p.id), ...tasks.map((t) => t.projectId)]);
    const userLogs = logs.filter((l) => l.userId === u.id);
    const daily = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(sevenDaysAgo.getTime() + i * DAY_MS);
      const log = userLogs.find((l) => startOfDay(l.date).getTime() === day.getTime());
      return log?.tasksCompleted ?? 0;
    });

    return {
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      role: u.jobTitle || (u.role === 'ADMIN' ? 'Admin' : 'Team Member'),
      accountRole: u.role,
      projects: projectIds.size,
      completed: completed.length,
      onTime: onTimeRate,
      quality: Math.round(avgQuality * 20),
      score,
      daily,
      verticals: u.verticalTags,
    };
  });
}

/** Per vertical: assigned/completed task counts, on-time rate, avg quality. */
export async function getVerticalKpis() {
  const verticals = await prisma.vertical.findMany({
    include: { tasks: true },
    orderBy: { name: 'asc' },
  });

  return verticals.map((v) => {
    const assigned = v.tasks.length;
    const completed = v.tasks.filter((t) => t.status === 'DONE');
    const onTimeCompleted = completed.filter((t) => !t.dueDate || (t.completedAt && t.completedAt <= t.dueDate));
    const qualityScores = completed.map((t) => t.qualityScore).filter((q): q is number => q != null);
    const avgQuality = qualityScores.length ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 4.2;

    return {
      id: v.id,
      name: v.name,
      short: v.shortName,
      score: pct(completed.length, assigned || 1),
      assigned,
      completed: completed.length,
      onTime: pct(onTimeCompleted.length, completed.length || 1),
      quality: Number(avgQuality.toFixed(1)),
      response: '—',
      trend: 0,
    };
  });
}

/** Top-level counters shown on the Overview page. */
export async function getDashboardSummary() {
  const [clients, activeProjects, openProposals, team, verticals] = await Promise.all([
    prisma.client.count(),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.proposal.count({ where: { status: { notIn: ['WON', 'LOST'] } } }),
    prisma.user.count({ where: { active: true } }),
    getVerticalKpis(),
  ]);

  const teamKpis = await getTeamKpis();
  const totalAssigned = verticals.reduce((s, v) => s + v.assigned, 0);
  const totalCompleted = verticals.reduce((s, v) => s + v.completed, 0);
  const overall = verticals.length ? Math.round(verticals.reduce((s, v) => s + v.score, 0) / verticals.length) : 0;
  const onTime = teamKpis.length ? Math.round(teamKpis.reduce((s, m) => s + m.onTime, 0) / teamKpis.length) : 0;
  const quality = teamKpis.length ? (teamKpis.reduce((s, m) => s + m.quality, 0) / teamKpis.length / 20).toFixed(1) : '4.2';

  return { clients, activeProjects, proposals: openProposals, team, campaigns: totalAssigned, overall, totalAssigned, totalCompleted, onTime, quality };
}

/** Historical KPI series for the Reports page — daily task completions & hours over a date range. */
export async function getHistoricalKpis(days = 30, userId?: string) {
  const today = startOfDay(new Date());
  const from = new Date(today.getTime() - (days - 1) * DAY_MS);

  const [logs, doneEvents] = await Promise.all([
    prisma.dailyLog.findMany({
      where: { date: { gte: from }, ...(userId ? { userId } : {}) },
    }),
    prisma.taskStatusEvent.findMany({
      where: { toStatus: 'DONE', createdAt: { gte: from }, ...(userId ? { changedById: userId } : {}) },
    }),
  ]);

  return Array.from({ length: days }).map((_, i) => {
    const day = new Date(from.getTime() + i * DAY_MS);
    const dayLogs = logs.filter((l) => startOfDay(l.date).getTime() === day.getTime());
    const dayDone = doneEvents.filter((e) => startOfDay(e.createdAt).getTime() === day.getTime());
    return {
      date: day.toISOString().slice(0, 10),
      tasksCompleted: dayLogs.reduce((s, l) => s + l.tasksCompleted, 0) || dayDone.length,
      hoursLogged: Number(dayLogs.reduce((s, l) => s + l.hoursLogged, 0).toFixed(1)),
    };
  });
}
