import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const VERTICALS = [
  { name: 'Performance Marketing', shortName: 'PPC' },
  { name: 'SEO', shortName: 'SEO' },
  { name: 'Social Media Management', shortName: 'SMM' },
  { name: 'Content Creation', shortName: 'Content' },
  { name: 'Outreach', shortName: 'Outreach' },
  { name: 'Email Marketing', shortName: 'Email' },
  { name: 'Web & App Development', shortName: 'Web/App' },
  { name: 'Branding & Design', shortName: 'Branding' },
  { name: 'Paid Media (Ads)', shortName: 'Paid Ads' },
  { name: 'Analytics & Reporting', shortName: 'Analytics' },
];

// [name, email, role, jobTitle, verticalTags]
const TEAM: [string, string, 'ADMIN' | 'MEMBER', string, string[]][] = [
  ['Rashid Admin', 'admin@31g.com', 'ADMIN', 'Operations Admin', []],
  ['Ali Raza', 'ali.raza@31g.com', 'MEMBER', 'Social Media Executive', ['SMM', 'Content']],
  ['Sara Khan', 'sara.khan@31g.com', 'MEMBER', 'Content Specialist', ['Content', 'Email']],
  ['Hamza Ali', 'hamza.ali@31g.com', 'MEMBER', 'SEO Specialist', ['SEO', 'Analytics']],
  ['Ayesha Iqbal', 'ayesha.iqbal@31g.com', 'MEMBER', 'Paid Media Specialist', ['PPC', 'Paid Ads']],
  ['Bilal Ahmed', 'bilal.ahmed@31g.com', 'MEMBER', 'Outreach Specialist', ['Outreach', 'Email']],
  ['Hina Fatima', 'hina.fatima@31g.com', 'MEMBER', 'Graphic Designer', ['Branding', 'SMM']],
  ['Usman Tariq', 'usman.tariq@31g.com', 'MEMBER', 'Analytics & Reporting', ['Analytics', 'SEO']],
  ['Zain Noor', 'zain.noor@31g.com', 'MEMBER', 'Project Coordinator', ['SMM', 'PPC']],
  ['Maria Shah', 'maria.shah@31g.com', 'MEMBER', 'Social Media Executive', ['SMM', 'Content']],
];

const DEFAULT_PASSWORD = 'ChangeMe123!';

const CLIENTS = [
  { name: 'TechNova', verticals: ['SMM', 'PPC', 'SEO'], campaigns: 5, reach: '284.6K', engagement: '4.8%', leads: 1240, conversions: 210, score: 92, status: 'ACTIVE' as const },
  { name: 'GreenLeaf', verticals: ['SEO', 'Content', 'Outreach'], campaigns: 4, reach: '198.2K', engagement: '3.9%', leads: 890, conversions: 135, score: 88, status: 'ACTIVE' as const },
  { name: 'Urban Bites', verticals: ['SMM', 'PPC', 'Content'], campaigns: 6, reach: '412.5K', engagement: '6.7%', leads: 2340, conversions: 410, score: 84, status: 'ACTIVE' as const },
  { name: 'MedCare', verticals: ['SEO', 'Content', 'SMM'], campaigns: 3, reach: '176.8K', engagement: '4.1%', leads: 760, conversions: 120, score: 78, status: 'ACTIVE' as const },
  { name: 'EduPro', verticals: ['SMM', 'Outreach', 'Content'], campaigns: 3, reach: '142.6K', engagement: '3.5%', leads: 640, conversions: 95, score: 76, status: 'ACTIVE' as const },
  { name: 'Luxe Homes', verticals: ['Instagram', 'PPC', 'SEO'], campaigns: 2, reach: '98.4K', engagement: '2.8%', leads: 420, conversions: 60, score: 70, status: 'AT_RISK' as const },
  { name: 'FitLife', verticals: ['SMM', 'Content', 'SEO'], campaigns: 3, reach: '86.3K', engagement: '3.1%', leads: 380, conversions: 52, score: 68, status: 'ACTIVE' as const },
  { name: 'TravelVista', verticals: ['SMM', 'PPC', 'Outreach'], campaigns: 2, reach: '72.1K', engagement: '2.4%', leads: 310, conversions: 40, score: 65, status: 'AT_RISK' as const },
];

async function main() {
  console.log('Seeding verticals...');
  const verticalByShort = new Map<string, string>();
  for (const v of VERTICALS) {
    const created = await prisma.vertical.upsert({ where: { name: v.name }, update: {}, create: v });
    verticalByShort.set(v.shortName, created.id);
  }

  console.log('Seeding team accounts...');
  const userByEmail = new Map<string, string>();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  for (const [name, email, role, jobTitle, tags] of TEAM) {
    const created = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, role, jobTitle, verticalTags: tags, passwordHash },
    });
    userByEmail.set(email, created.id);
  }

  console.log('Seeding clients...');
  const existingClients = await prisma.client.count();
  const clientIds: string[] = [];
  if (existingClients === 0) {
    for (const c of CLIENTS) {
      const created = await prisma.client.create({
        data: {
          name: c.name,
          verticalTags: c.verticals,
          campaigns: c.campaigns,
          reach: c.reach,
          engagement: c.engagement,
          leads: c.leads,
          conversions: c.conversions,
          healthScore: c.score,
          status: c.status,
        },
      });
      clientIds.push(created.id);
    }
  } else {
    console.log('Clients already exist — skipping (seed is not re-run on a populated DB).');
    return;
  }
  const client = (i: number) => clientIds[i - 1];
  const memberId = (email: string) => userByEmail.get(email)!;
  const verticalId = (short: string) => verticalByShort.get(short)!;

  console.log('Seeding projects...');
  const projectSeed = [
    { name: 'TechNova Growth Engine', clientId: client(1), verticalId: verticalId('PPC'), ownerId: memberId('ayesha.iqbal@31g.com'), status: 'ACTIVE' as const, due: '2026-09-20', priority: 'HIGH' as const },
    { name: 'TechNova SEO Sprint', clientId: client(1), verticalId: verticalId('SEO'), ownerId: memberId('hamza.ali@31g.com'), status: 'ACTIVE' as const, due: '2026-09-24', priority: 'HIGH' as const },
    { name: 'GreenLeaf Authority', clientId: client(2), verticalId: verticalId('SEO'), ownerId: memberId('hamza.ali@31g.com'), status: 'REVIEW' as const, due: '2026-09-17', priority: 'MEDIUM' as const },
    { name: 'GreenLeaf Outreach', clientId: client(2), verticalId: verticalId('Outreach'), ownerId: memberId('bilal.ahmed@31g.com'), status: 'ACTIVE' as const, due: '2026-09-26', priority: 'HIGH' as const },
    { name: 'Urban Bites Social', clientId: client(3), verticalId: verticalId('SMM'), ownerId: memberId('ali.raza@31g.com'), status: 'ACTIVE' as const, due: '2026-09-22', priority: 'HIGH' as const },
    { name: 'Urban Bites Paid Campaign', clientId: client(3), verticalId: verticalId('Paid Ads'), ownerId: memberId('ayesha.iqbal@31g.com'), status: 'ACTIVE' as const, due: '2026-09-21', priority: 'MEDIUM' as const },
    { name: 'MedCare Content Hub', clientId: client(4), verticalId: verticalId('Content'), ownerId: memberId('sara.khan@31g.com'), status: 'PLANNING' as const, due: '2026-10-02', priority: 'MEDIUM' as const },
    { name: 'EduPro Social Growth', clientId: client(5), verticalId: verticalId('SMM'), ownerId: memberId('maria.shah@31g.com'), status: 'ACTIVE' as const, due: '2026-09-28', priority: 'MEDIUM' as const },
    { name: 'Luxe Homes Lead Gen', clientId: client(6), verticalId: verticalId('PPC'), ownerId: memberId('ayesha.iqbal@31g.com'), status: 'BLOCKED' as const, due: '2026-09-19', priority: 'HIGH' as const },
    { name: 'TravelVista Link Building', clientId: client(8), verticalId: verticalId('Outreach'), ownerId: memberId('bilal.ahmed@31g.com'), status: 'ACTIVE' as const, due: '2026-09-30', priority: 'MEDIUM' as const },
  ];
  const projectIds: string[] = [];
  for (const p of projectSeed) {
    const created = await prisma.project.create({
      data: { name: p.name, clientId: p.clientId, verticalId: p.verticalId, ownerId: p.ownerId, status: p.status, dueDate: new Date(p.due), priority: p.priority },
    });
    projectIds.push(created.id);
  }
  const project = (i: number) => projectIds[i - 1];

  console.log('Seeding tasks...');
  const taskSeed = [
    { title: 'Launch Meta retargeting campaign', projectId: project(1), clientId: client(1), verticalId: verticalId('PPC'), assigneeId: memberId('ayesha.iqbal@31g.com'), due: '2026-09-15', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, estimated: 3 },
    { title: 'Publish 5 social creatives', projectId: project(5), clientId: client(3), verticalId: verticalId('SMM'), assigneeId: memberId('ali.raza@31g.com'), due: '2026-09-15', status: 'TODO' as const, priority: 'HIGH' as const, estimated: 4 },
    { title: 'Finalize SEO report', projectId: project(3), clientId: client(2), verticalId: verticalId('SEO'), assigneeId: memberId('hamza.ali@31g.com'), due: '2026-09-16', status: 'REVIEW' as const, priority: 'MEDIUM' as const, estimated: 2 },
    { title: 'Prospect list enrichment', projectId: project(4), clientId: client(2), verticalId: verticalId('Outreach'), assigneeId: memberId('bilal.ahmed@31g.com'), due: '2026-09-16', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, estimated: 5 },
    { title: 'Monthly content calendar', projectId: project(7), clientId: client(4), verticalId: verticalId('Content'), assigneeId: memberId('sara.khan@31g.com'), due: '2026-09-17', status: 'TODO' as const, priority: 'MEDIUM' as const, estimated: 3 },
    { title: 'Client approval follow-up', projectId: project(9), clientId: client(6), verticalId: verticalId('PPC'), assigneeId: memberId('zain.noor@31g.com'), due: '2026-09-17', status: 'TODO' as const, priority: 'HIGH' as const, estimated: 1 },
    { title: 'Analytics dashboard QA', projectId: project(2), clientId: client(1), verticalId: verticalId('SEO'), assigneeId: memberId('usman.tariq@31g.com'), due: '2026-09-18', status: 'REVIEW' as const, priority: 'LOW' as const, estimated: 2 },
    { title: 'Email nurture sequence', projectId: project(8), clientId: client(5), verticalId: verticalId('Email'), assigneeId: memberId('sara.khan@31g.com'), due: '2026-09-19', status: 'IN_PROGRESS' as const, priority: 'MEDIUM' as const, estimated: 4 },
    { title: 'Outreach campaign batch 2', projectId: project(10), clientId: client(8), verticalId: verticalId('Outreach'), assigneeId: memberId('bilal.ahmed@31g.com'), due: '2026-09-20', status: 'TODO' as const, priority: 'MEDIUM' as const, estimated: 6 },
    { title: 'Brand refresh concepts', projectId: project(7), clientId: client(4), verticalId: verticalId('Branding'), assigneeId: memberId('hina.fatima@31g.com'), due: '2026-09-20', status: 'DONE' as const, priority: 'LOW' as const, estimated: 4 },
  ];
  for (const t of taskSeed) {
    const created = await prisma.task.create({
      data: {
        title: t.title,
        projectId: t.projectId,
        clientId: t.clientId,
        verticalId: t.verticalId,
        assigneeId: t.assigneeId,
        dueDate: new Date(t.due),
        status: t.status,
        priority: t.priority,
        estimatedHours: t.estimated,
        qualityScore: t.status === 'DONE' ? 4.5 : null,
        completedAt: t.status === 'DONE' ? new Date() : null,
      },
    });
    await prisma.taskStatusEvent.create({ data: { taskId: created.id, toStatus: t.status } });
  }

  console.log('Seeding proposals...');
  const proposals = [
    { client: 'ForestTech', service: 'SEO + Content', status: 'IN_PROGRESS' as const, value: 2500, next: 'Send deck' },
    { client: 'Wellness Co.', service: 'Social Media Mgmt', status: 'IN_REVIEW' as const, value: 1800, next: 'Follow up' },
    { client: 'BrightEdu', service: 'SMM + Ads', status: 'IN_PROGRESS' as const, value: 3200, next: 'Client call' },
    { client: 'HomeDecor', service: 'Content + Outreach', status: 'DRAFT' as const, value: 2000, next: 'Finalize plan' },
  ];
  for (const p of proposals) {
    await prisma.proposal.create({ data: { clientName: p.client, service: p.service, status: p.status, value: p.value, nextStep: p.next } });
  }

  console.log('Seeding a week of daily work logs...');
  const dailySample: Record<string, number[]> = {
    'ali.raza@31g.com': [6, 8, 7, 6, 8, 4, 3],
    'sara.khan@31g.com': [5, 7, 6, 7, 6, 3, 2],
    'hamza.ali@31g.com': [5, 6, 6, 5, 7, 3, 3],
    'ayesha.iqbal@31g.com': [4, 6, 5, 6, 6, 3, 2],
    'bilal.ahmed@31g.com': [6, 5, 7, 5, 6, 4, 3],
    'hina.fatima@31g.com': [4, 5, 5, 5, 6, 3, 2],
    'usman.tariq@31g.com': [4, 6, 5, 4, 7, 3, 4],
    'zain.noor@31g.com': [3, 4, 4, 5, 5, 3, 2],
    'maria.shah@31g.com': [3, 5, 4, 4, 5, 2, 3],
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const [email, counts] of Object.entries(dailySample)) {
    for (let i = 0; i < counts.length; i++) {
      const date = new Date(today.getTime() - (counts.length - 1 - i) * 86400000);
      await prisma.dailyLog.upsert({
        where: { userId_date: { userId: memberId(email), date } },
        update: { tasksCompleted: counts[i], hoursLogged: counts[i] * 0.75 },
        create: { userId: memberId(email), date, tasksCompleted: counts[i], hoursLogged: counts[i] * 0.75 },
      });
    }
  }

  console.log('\nSeed complete.');
  console.log(`Login as admin@31g.com or any team email above, password: ${DEFAULT_PASSWORD}`);
  console.log('Change these passwords before real use.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
