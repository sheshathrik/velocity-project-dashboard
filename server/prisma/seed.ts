import { PrismaClient, Role, TaskStatus, TaskPriority, ActivityType, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data in reverse relation order
  await prisma.notification.deleteMany();
  await prisma.taskActivityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned up existing database records.');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@velozity.com',
      name: 'Alex Vance',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 2 Project Managers
  const pmSarah = await prisma.user.create({
    data: {
      email: 'pm.sarah@velozity.com',
      name: 'Sarah Connor',
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const pmMichael = await prisma.user.create({
    data: {
      email: 'pm.michael@velozity.com',
      name: 'Michael Scott',
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  // 4 Developers
  const devRavi = await prisma.user.create({
    data: {
      email: 'dev.ravi@velozity.com',
      name: 'Ravi Kumar',
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const devAnita = await prisma.user.create({
    data: {
      email: 'dev.anita@velozity.com',
      name: 'Anita Desai',
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const devCarlos = await prisma.user.create({
    data: {
      email: 'dev.carlos@velozity.com',
      name: 'Carlos Mendez',
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const devEmily = await prisma.user.create({
    data: {
      email: 'dev.emily@velozity.com',
      name: 'Emily Watson',
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  console.log('👥 Created 1 Admin, 2 PMs, and 4 Developers.');

  // 2. Create Clients
  const clientAcme = await prisma.client.create({
    data: {
      name: 'Acme Corporation',
      email: 'contracts@acme.com',
      company: 'Acme Holdings Inc.',
    },
  });

  const clientTechWave = await prisma.client.create({
    data: {
      name: 'TechWave Labs',
      email: 'lead@techwave.io',
      company: 'TechWave Technologies LLC',
    },
  });

  const clientVertex = await prisma.client.create({
    data: {
      name: 'Vertex Digital Partners',
      email: 'projects@vertex.co',
      company: 'Vertex Digital Group',
    },
  });

  console.log('🏢 Created 3 Clients.');

  // 3. Create Projects (At least 3 projects)
  // Project 1: Sarah
  const projectCloud = await prisma.project.create({
    data: {
      name: 'Cloud Infrastructure Migration',
      description: 'Zero-downtime AWS to GCP containerized Kubernetes cluster migration and multi-region deployment.',
      clientId: clientAcme.id,
      managerId: pmSarah.id,
    },
  });

  // Project 2: Michael
  const projectBanking = await prisma.project.create({
    data: {
      name: 'Mobile Banking App Redesign',
      description: 'Next-generation fintech banking mobile experience featuring biometric authentication and real-time wire transfers.',
      clientId: clientTechWave.id,
      managerId: pmMichael.id,
    },
  });

  // Project 3: Sarah
  const projectAnalytics = await prisma.project.create({
    data: {
      name: 'Enterprise Analytics Engine',
      description: 'High-throughput stream processing analytics engine with real-time customer behavioral cohorts.',
      clientId: clientVertex.id,
      managerId: pmSarah.id,
    },
  });

  console.log('📁 Created 3 Projects with designated Project Managers.');

  const now = new Date();
  const pastDate3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const pastDate5d = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const futureDate2d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const futureDate5d = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const futureDate10d = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // 4. Create Tasks (at least 5+ tasks each, with at least 2 already overdue)
  // Project 1 Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Terraform VPC & Subnet Automation',
      description: 'Implement multi-AZ subnets, NAT gateways, and transit gateway routing modules.',
      projectId: projectCloud.id,
      assignedDeveloperId: devRavi.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate3d, // OVERDUE
      isOverdue: true,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'PostgreSQL Database Replication Setup',
      description: 'Configure cross-region read replicas and automated failover drills with zero data loss.',
      projectId: projectCloud.id,
      assignedDeveloperId: devAnita.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: pastDate5d, // OVERDUE
      isOverdue: true,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Kubernetes Ingress & TLS Configuration',
      description: 'Provision cert-manager with Let’s Encrypt automated renewal and Cloudflare CDN proxying.',
      projectId: projectCloud.id,
      assignedDeveloperId: devCarlos.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate5d,
      isOverdue: false,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Prometheus & Grafana Observability Dashboards',
      description: 'Set up cluster node metrics, pod CPU/memory alerts, and latency percentiles.',
      projectId: projectCloud.id,
      assignedDeveloperId: devEmily.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: pastDate3d,
      isOverdue: false,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'CI/CD Pipeline Security Scanning',
      description: 'Integrate Trivy container vulnerability scanning and SonarQube static analysis in GitHub Actions.',
      projectId: projectCloud.id,
      assignedDeveloperId: devRavi.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureDate2d,
      isOverdue: false,
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: 'Disaster Recovery Warm Standby Drill',
      description: 'Simulate primary cluster failure and verify 15-minute RTO / 1-minute RPO targets.',
      projectId: projectCloud.id,
      assignedDeveloperId: devAnita.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate10d,
      isOverdue: false,
    },
  });

  // Project 2 Tasks (Michael)
  const task7 = await prisma.task.create({
    data: {
      title: 'Biometric FaceID / Fingerprint Auth Flow',
      description: 'Native hardware key store integration with biometric fallback password prompt.',
      projectId: projectBanking.id,
      assignedDeveloperId: devCarlos.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureDate2d,
      isOverdue: false,
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: 'Wire Transfer Confirmation Screen',
      description: 'Create multi-step verification modal with dynamic SMS 2FA code entry and fraud guard banner.',
      projectId: projectBanking.id,
      assignedDeveloperId: devEmily.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate5d,
      isOverdue: false,
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: 'Account Statement PDF Export Service',
      description: 'Generate digitally signed monthly transaction reports formatted for standard PDF viewers.',
      projectId: projectBanking.id,
      assignedDeveloperId: devRavi.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: pastDate3d,
      isOverdue: false,
    },
  });

  const task10 = await prisma.task.create({
    data: {
      title: 'Dark Mode & Dynamic Typography System',
      description: 'Implement WCAG AA compliant contrast ratios and localized RTL Arabic layout support.',
      projectId: projectBanking.id,
      assignedDeveloperId: devAnita.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate10d,
      isOverdue: false,
    },
  });

  const task11 = await prisma.task.create({
    data: {
      title: 'Plaid Open Banking Integration',
      description: 'Link external checking accounts with webhook-based balance synching and error retries.',
      projectId: projectBanking.id,
      assignedDeveloperId: devCarlos.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureDate5d,
      isOverdue: false,
    },
  });

  // Project 3 Tasks (Sarah)
  const task12 = await prisma.task.create({
    data: {
      title: 'Kafka Event Consumer Partitioning',
      description: 'Optimize topic consumer concurrency to sustain 50,000 ingest events/sec during peak traffic.',
      projectId: projectAnalytics.id,
      assignedDeveloperId: devRavi.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate2d,
      isOverdue: false,
    },
  });

  const task13 = await prisma.task.create({
    data: {
      title: 'Real-Time Cohort Segmentation Query',
      description: 'ClickHouse aggregate materialization query for instant user filter calculations.',
      projectId: projectAnalytics.id,
      assignedDeveloperId: devAnita.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: futureDate5d,
      isOverdue: false,
    },
  });

  const task14 = await prisma.task.create({
    data: {
      title: 'Export to Snowflake & BigQuery Connectors',
      description: 'Automate daily parquet batch export with S3 intermediate staging and audit logging.',
      projectId: projectAnalytics.id,
      assignedDeveloperId: devCarlos.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate10d,
      isOverdue: false,
    },
  });

  const task15 = await prisma.task.create({
    data: {
      title: 'Anomaly Detection Alerting Rule Engine',
      description: 'Calculate statistical rolling standard deviation bounds and trigger Slack webhooks.',
      projectId: projectAnalytics.id,
      assignedDeveloperId: devEmily.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: futureDate5d,
      isOverdue: false,
    },
  });

  const task16 = await prisma.task.create({
    data: {
      title: 'API Rate Limiter & Token Bucket Guard',
      description: 'Redis token bucket rate limiter with tiered quotas by client organization plan.',
      projectId: projectAnalytics.id,
      assignedDeveloperId: devRavi.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: pastDate5d,
      isOverdue: false,
    },
  });

  console.log('✅ Created 16 Tasks across 3 Projects with 2 Overdue tasks.');

  // 5. Create Pre-existing Activity Log Entries
  // Format required: "who made the change, what they changed, and when — formatted as 'Ravi moved Task #12 from In Progress → In Review · 2 mins ago'"
  const logs = [
    {
      taskId: task1.id,
      projectId: projectCloud.id,
      userId: devRavi.id,
      type: ActivityType.STATUS_CHANGE,
      message: `${devRavi.name} moved Task #${task1.id} from In Progress → In Review`,
      details: {
        fromStatus: 'IN_PROGRESS',
        toStatus: 'IN_REVIEW',
        taskTitle: task1.title,
      },
      createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 mins ago
    },
    {
      taskId: task2.id,
      projectId: projectCloud.id,
      userId: admin.id,
      type: ActivityType.TASK_OVERDUE,
      message: `System Scheduler flagged Task #${task2.id} as Overdue`,
      details: {
        fromStatus: 'IN_PROGRESS',
        toStatus: 'IN_PROGRESS',
        taskTitle: task2.title,
        reason: 'Due date passed without completion',
      },
      createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 mins ago
    },
    {
      taskId: task8.id,
      projectId: projectBanking.id,
      userId: devEmily.id,
      type: ActivityType.STATUS_CHANGE,
      message: `${devEmily.name} moved Task #${task8.id} from In Progress → In Review`,
      details: {
        fromStatus: 'IN_PROGRESS',
        toStatus: 'IN_REVIEW',
        taskTitle: task8.title,
      },
      createdAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 mins ago
    },
    {
      taskId: task13.id,
      projectId: projectAnalytics.id,
      userId: devAnita.id,
      type: ActivityType.STATUS_CHANGE,
      message: `${devAnita.name} moved Task #${task13.id} from In Progress → In Review`,
      details: {
        fromStatus: 'IN_PROGRESS',
        toStatus: 'IN_REVIEW',
        taskTitle: task13.title,
      },
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      taskId: task7.id,
      projectId: projectBanking.id,
      userId: devCarlos.id,
      type: ActivityType.STATUS_CHANGE,
      message: `${devCarlos.name} moved Task #${task7.id} from To Do → In Progress`,
      details: {
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
        taskTitle: task7.title,
      },
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      taskId: task4.id,
      projectId: projectCloud.id,
      userId: devEmily.id,
      type: ActivityType.STATUS_CHANGE,
      message: `${devEmily.name} moved Task #${task4.id} from In Review → Done`,
      details: {
        fromStatus: 'IN_REVIEW',
        toStatus: 'DONE',
        taskTitle: task4.title,
      },
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      taskId: task5.id,
      projectId: projectCloud.id,
      userId: pmSarah.id,
      type: ActivityType.TASK_ASSIGNED,
      message: `${pmSarah.name} assigned Task #${task5.id} to ${devRavi.name}`,
      details: {
        assignedTo: devRavi.name,
        taskTitle: task5.title,
      },
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      taskId: task9.id,
      projectId: projectBanking.id,
      userId: devRavi.id,
      type: ActivityType.STATUS_CHANGE,
      message: `${devRavi.name} moved Task #${task9.id} from In Review → Done`,
      details: {
        fromStatus: 'IN_REVIEW',
        toStatus: 'DONE',
        taskTitle: task9.title,
      },
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      taskId: task16.id,
      projectId: projectAnalytics.id,
      userId: devRavi.id,
      type: ActivityType.STATUS_CHANGE,
      message: `${devRavi.name} moved Task #${task16.id} from In Review → Done`,
      details: {
        fromStatus: 'IN_REVIEW',
        toStatus: 'DONE',
        taskTitle: task16.title,
      },
      createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
    },
  ];

  for (const log of logs) {
    await prisma.taskActivityLog.create({
      data: log,
    });
  }

  console.log('📜 Created pre-existing Activity Log entries.');

  // 6. Create Initial Notifications
  await prisma.notification.create({
    data: {
      userId: pmSarah.id,
      taskId: task1.id,
      type: NotificationType.TASK_IN_REVIEW,
      title: 'Task In Review',
      message: `${devRavi.name} submitted Task #${task1.id} ("${task1.title}") for review.`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: pmMichael.id,
      taskId: task8.id,
      type: NotificationType.TASK_IN_REVIEW,
      title: 'Task In Review',
      message: `${devEmily.name} submitted Task #${task8.id} ("${task8.title}") for review.`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: devRavi.id,
      taskId: task5.id,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `You were assigned Task #${task5.id}: "${task5.title}"`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: devAnita.id,
      taskId: task2.id,
      type: NotificationType.TASK_OVERDUE,
      title: 'Task Overdue Notice',
      message: `Task #${task2.id} ("${task2.title}") is past its due date.`,
      isRead: false,
    },
  });

  console.log('🔔 Created initial Notifications.');
  console.log('🎉 Seed complete! Default password for all users: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

