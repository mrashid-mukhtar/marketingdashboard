// Keeps the existing Dashboard.tsx UI working unchanged: it expects human-readable
// strings like 'At Risk' / 'In Progress', while the DB stores clean enums.

export const clientStatusToLabel: Record<string, string> = {
  ACTIVE: 'Active',
  AT_RISK: 'At Risk',
  PAUSED: 'Paused',
};
export const clientStatusFromLabel: Record<string, string> = {
  Active: 'ACTIVE',
  'At Risk': 'AT_RISK',
  Paused: 'PAUSED',
};

export const projectStatusToLabel: Record<string, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
};
export const projectStatusFromLabel: Record<string, string> = {
  Planning: 'PLANNING',
  Active: 'ACTIVE',
  Review: 'REVIEW',
  Completed: 'COMPLETED',
  Blocked: 'BLOCKED',
};

export const taskStatusToLabel: Record<string, string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};
export const taskStatusFromLabel: Record<string, string> = {
  Todo: 'TODO',
  'In Progress': 'IN_PROGRESS',
  Review: 'REVIEW',
  Done: 'DONE',
};

export const priorityToLabel: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
export const priorityFromLabel: Record<string, string> = { Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH' };

export const proposalStatusToLabel: Record<string, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In Review',
  IN_PROGRESS: 'In Progress',
  WON: 'Won',
  LOST: 'Lost',
};
export const proposalStatusFromLabel: Record<string, string> = {
  Draft: 'DRAFT',
  'In Review': 'IN_REVIEW',
  'In Progress': 'IN_PROGRESS',
  Won: 'WON',
  Lost: 'LOST',
};

function toDateOnly(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : null;
}

export function mapClient(c: any) {
  return {
    id: c.id,
    name: c.name,
    verticals: c.verticalTags,
    campaigns: c.campaigns,
    reach: c.reach,
    engagement: c.engagement,
    leads: c.leads,
    conversions: c.conversions,
    score: c.healthScore,
    status: clientStatusToLabel[c.status] ?? c.status,
  };
}

export function mapProject(p: any) {
  return {
    id: p.id,
    name: p.name,
    clientId: p.clientId,
    vertical: p.vertical?.name ?? '',
    verticalId: p.verticalId,
    ownerId: p.ownerId,
    status: projectStatusToLabel[p.status] ?? p.status,
    progress: p.tasks?.length ? Math.round((p.tasks.filter((t: any) => t.status === 'DONE').length / p.tasks.length) * 100) : 0,
    due: toDateOnly(p.dueDate),
    tasks: p.tasks?.length ?? p._count?.tasks ?? 0,
    completedTasks: p.tasks?.filter((t: any) => t.status === 'DONE').length ?? 0,
    priority: priorityToLabel[p.priority] ?? p.priority,
  };
}

export function mapTask(t: any) {
  return {
    id: t.id,
    title: t.title,
    projectId: t.projectId,
    clientId: t.clientId,
    vertical: t.vertical?.name ?? '',
    verticalId: t.verticalId,
    assigneeId: t.assigneeId,
    due: toDateOnly(t.dueDate),
    status: taskStatusToLabel[t.status] ?? t.status,
    priority: priorityToLabel[t.priority] ?? t.priority,
    estimated: t.estimatedHours ?? 0,
    qualityScore: t.qualityScore,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
  };
}

export function mapProposal(p: any) {
  return {
    id: p.id,
    client: p.clientName,
    clientId: p.clientId,
    service: p.service,
    status: proposalStatusToLabel[p.status] ?? p.status,
    value: p.value,
    next: p.nextStep,
  };
}
