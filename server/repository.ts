import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose, { Schema, type Model } from 'mongoose';
import type {
  AgentProfile,
  CategoryBreakdown,
  CreateTicketPayload,
  DashboardStats,
  Ticket,
  TicketCategory,
  TicketNote,
  TicketPriority,
  TicketStatus,
  UpdateTicketPayload,
} from '../src/types/helpdesk.ts';

export const SUPPORT_AGENTS: AgentProfile[] = [
  {
    id: 'agent-ananya',
    name: 'Ananya Deshmukh',
    role: 'IT Operations Lead',
    specialty: 'Software',
    email: 'ananya.d@deskline.io',
    avatarUrl: '/src/assets/images/avatar_admin_lead_1794995923654.jpg',
  },
  {
    id: 'agent-marcus',
    name: 'Marcus Weber',
    role: 'Systems & Hardware Engineer',
    specialty: 'Hardware',
    email: 'marcus.w@deskline.io',
    avatarUrl: '/src/assets/images/avatar_hardware_tech_1794995926690.jpg',
  },
  {
    id: 'agent-zoe',
    name: 'Zoe Mensah',
    role: 'Network & Access Specialist',
    specialty: 'Network',
    email: 'zoe.m@deskline.io',
    avatarUrl: '/src/assets/images/avatar_network_eng_1794995940995.jpg',
  },
  {
    id: 'agent-devon',
    name: 'Devon Park',
    role: 'Identity & Account Administrator',
    specialty: 'Account',
    email: 'devon.p@deskline.io',
    avatarUrl: '/src/assets/images/avatar_admin_lead_1794995923654.jpg',
  },
];

const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
  Critical: 2,
  High: 8,
  Medium: 24,
  Low: 72,
};

function computeSlaDue(createdIso: string, priority: TicketPriority): string {
  const created = new Date(createdIso).getTime();
  const hours = SLA_HOURS_BY_PRIORITY[priority] ?? 24;
  return new Date(created + hours * 3600 * 1000).toISOString();
}

const NoteSchema = new Schema<TicketNote>(
  {
    id: { type: String, required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, enum: ['Agent', 'Requester', 'System'], required: true },
    content: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const TicketSchema = new Schema<Ticket>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ticketNumber: { type: String, required: true, unique: true, index: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Hardware', 'Software', 'Network', 'Account'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      required: true,
      index: true,
    },
    requesterName: { type: String, required: true },
    requesterEmail: { type: String, required: true },
    department: { type: String, required: true },
    assetTag: { type: String },
    assigneeId: { type: String, default: null },
    assigneeName: { type: String, default: null },
    resolutionSummary: { type: String },
    notes: { type: [NoteSchema], default: [] },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    resolvedAt: { type: String, default: null },
    slaDueAt: { type: String, required: true },
  },
  { versionKey: false }
);

function buildInitialTickets(): Ticket[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

  const seeds: Array<Omit<Ticket, 'id' | 'slaDueAt'>> = [
    {
      ticketNumber: 'HD-1041',
      subject: 'Corporate VPN drops packets every 15 minutes on macOS 15',
      description:
        'Multiple engineers in the Frankfurt and Bengaluru remote offices report WireGuard tunnel disconnects when switching between conference calls. Local ISP diagnostics are clean; suspect gateway session timeout or MTU fragmentation.',
      category: 'Network',
      priority: 'Critical',
      status: 'In Progress',
      requesterName: 'Elena Rostova',
      requesterEmail: 'elena.r@acme-corp.com',
      department: 'Platform Engineering',
      assetTag: 'NET-GW-EU02',
      assigneeId: 'agent-zoe',
      assigneeName: 'Zoe Mensah',
      notes: [
        {
          id: 'n-1041-1',
          authorName: 'System',
          authorRole: 'System',
          content: 'Ticket created with Critical priority and routed to Network queue.',
          createdAt: hoursAgo(3.5),
        },
        {
          id: 'n-1041-2',
          authorName: 'Zoe Mensah',
          authorRole: 'Agent',
          content: 'Captured pcap logs from EU gateway; testing MTU 1380 clamp on staging profile.',
          createdAt: hoursAgo(1.2),
        },
      ],
      createdAt: hoursAgo(3.5),
      updatedAt: hoursAgo(1.2),
      resolvedAt: null,
    },
    {
      ticketNumber: 'HD-1042',
      subject: 'Okta SSO MFA token locked out after phone replacement',
      description:
        'Switched to a new company iPhone this morning and lost access to Okta Verify TOTP codes. Unable to sign into Slack, Jira, or AWS SSO console.',
      category: 'Account',
      priority: 'High',
      status: 'Pending',
      requesterName: 'Rohan Kulkarni',
      requesterEmail: 'rohan.k@acme-corp.com',
      department: 'Product Design',
      assetTag: 'IDP-OKTA-882',
      assigneeId: 'agent-devon',
      assigneeName: 'Devon Park',
      notes: [
        {
          id: 'n-1042-1',
          authorName: 'System',
          authorRole: 'System',
          content: 'Ticket created and queued for identity verification.',
          createdAt: hoursAgo(2.1),
        },
      ],
      createdAt: hoursAgo(2.1),
      updatedAt: hoursAgo(2.1),
      resolvedAt: null,
    },
    {
      ticketNumber: 'HD-1043',
      subject: 'ThinkPad X1 Carbon battery swelling and trackpad lift',
      description:
        'Bottom chassis near the trackpad has noticeably bowed over the past week and trackpad clicks no longer register reliably. Requesting urgent loaner laptop and hardware replacement.',
      category: 'Hardware',
      priority: 'High',
      status: 'In Progress',
      requesterName: 'Claire Vance',
      requesterEmail: 'claire.v@acme-corp.com',
      department: 'Finance & Legal',
      assetTag: 'LT-4409-X1',
      assigneeId: 'agent-marcus',
      assigneeName: 'Marcus Weber',
      notes: [
        {
          id: 'n-1043-1',
          authorName: 'Marcus Weber',
          authorRole: 'Agent',
          content: 'Advised user to power down device immediately. Prepping spare X1 Carbon unit LT-4812 for same-day courier.',
          createdAt: hoursAgo(4.0),
        },
      ],
      createdAt: hoursAgo(5.8),
      updatedAt: hoursAgo(4.0),
      resolvedAt: null,
    },
    {
      ticketNumber: 'HD-1044',
      subject: 'Docker Desktop license activation error on Windows 11 workstations',
      description:
        'After updating to Docker Desktop 4.38, three backend contractors receive "Organization seat limit reached" even though seats were freed yesterday.',
      category: 'Software',
      priority: 'Medium',
      status: 'Pending',
      requesterName: 'Tariq Al-Mansoor',
      requesterEmail: 'tariq.m@acme-corp.com',
      department: 'Backend Services',
      assetTag: 'LIC-DOCK-19',
      assigneeId: 'agent-ananya',
      assigneeName: 'Ananya Deshmukh',
      notes: [
        {
          id: 'n-1044-1',
          authorName: 'System',
          authorRole: 'System',
          content: 'Ticket assigned to Software Licensing queue.',
          createdAt: hoursAgo(6.5),
        },
      ],
      createdAt: hoursAgo(6.5),
      updatedAt: hoursAgo(6.5),
      resolvedAt: null,
    },
    {
      ticketNumber: 'HD-1045',
      subject: 'Conference Room B dual-4K USB-C hub failing video output',
      description:
        'HDMI port 2 on the Logitech table hub flickers and drops signal when connected to M3 MacBook Pros. Audio conferencing remains intact.',
      category: 'Hardware',
      priority: 'Medium',
      status: 'Resolved',
      requesterName: 'Hannah Brooks',
      requesterEmail: 'hannah.b@acme-corp.com',
      department: 'Customer Success',
      assetTag: 'AV-CONF-02B',
      assigneeId: 'agent-marcus',
      assigneeName: 'Marcus Weber',
      resolutionSummary:
        'Replaced faulty DisplayLink USB-C controller cable and updated hub firmware to v3.4.2. Tested dual-4K 60Hz output across macOS and Windows.',
      notes: [
        {
          id: 'n-1045-1',
          authorName: 'Marcus Weber',
          authorRole: 'Agent',
          content: 'Inspected table dock; confirmed bent pin on primary Thunderbolt uplink cable.',
          createdAt: hoursAgo(14),
        },
        {
          id: 'n-1045-2',
          authorName: 'Marcus Weber',
          authorRole: 'Agent',
          content: 'Resolved: Swapped certified Thunderbolt 4 cable and verified dual display sync.',
          createdAt: hoursAgo(11.5),
        },
      ],
      createdAt: hoursAgo(16),
      updatedAt: hoursAgo(11.5),
      resolvedAt: hoursAgo(11.5),
    },
    {
      ticketNumber: 'HD-1046',
      subject: 'Provision read-only Snowflake & Looker access for Q4 audit',
      description:
        'External audit prep requires read-only Looker Studio and Snowflake ANALYST_RO role for two new financial controllers starting Monday.',
      category: 'Account',
      priority: 'Low',
      status: 'Resolved',
      requesterName: 'Daniel Okafor',
      requesterEmail: 'daniel.o@acme-corp.com',
      department: 'Accounting',
      assetTag: 'IAM-SNOW-04',
      assigneeId: 'agent-devon',
      assigneeName: 'Devon Park',
      resolutionSummary:
        'Granted ANALYST_RO Okta group membership after manager approval in IAM log #8831. Verified SSO login with both controllers.',
      notes: [
        {
          id: 'n-1046-1',
          authorName: 'Devon Park',
          authorRole: 'Agent',
          content: 'Manager sign-off received; provisioned role bindings and notified requesters.',
          createdAt: hoursAgo(22),
        },
      ],
      createdAt: hoursAgo(28),
      updatedAt: hoursAgo(22),
      resolvedAt: hoursAgo(22),
    },
    {
      ticketNumber: 'HD-1047',
      subject: 'JetBrains IntelliJ IDEA indexing freezes when connected to SMB share',
      description:
        'IDE UI locks up for 45 seconds whenever project build outputs write to mounted network drive.',
      category: 'Software',
      priority: 'Medium',
      status: 'Resolved',
      requesterName: 'Lucas Meyer',
      requesterEmail: 'lucas.m@acme-corp.com',
      department: 'Core Systems',
      assetTag: 'SW-JB-210',
      assigneeId: 'agent-ananya',
      assigneeName: 'Ananya Deshmukh',
      resolutionSummary:
        'Excluded build/ and node_modules/ directories from real-time endpoint AV scan and moved local Gradle cache to NVMe SSD.',
      notes: [
        {
          id: 'n-1047-1',
          authorName: 'Ananya Deshmukh',
          authorRole: 'Agent',
          content: 'Applied CrowdStrike exclusion policy for local compiler caches and confirmed normal CPU utilization.',
          createdAt: hoursAgo(30),
        },
      ],
      createdAt: hoursAgo(35),
      updatedAt: hoursAgo(30),
      resolvedAt: hoursAgo(30),
    },
    {
      ticketNumber: 'HD-1048',
      subject: 'Floor 4 West Wi-Fi access point offline after firmware push',
      description:
        'Around 18 desks on Floor 4 West lost Corp-5GHz SSID broadcast following last night’s scheduled controller patch.',
      category: 'Network',
      priority: 'Critical',
      status: 'Pending',
      requesterName: 'Priya Nair',
      requesterEmail: 'priya.n@acme-corp.com',
      department: 'Workplace Ops',
      assetTag: 'AP-FL4-W03',
      assigneeId: null,
      assigneeName: null,
      notes: [
        {
          id: 'n-1048-1',
          authorName: 'System',
          authorRole: 'System',
          content: 'Critical alert logged; awaiting engineer triage.',
          createdAt: hoursAgo(0.8),
        },
      ],
      createdAt: hoursAgo(0.8),
      updatedAt: hoursAgo(0.8),
      resolvedAt: null,
    },
    {
      ticketNumber: 'HD-1049',
      subject: 'External monitor color calibration profile resets after sleep',
      description:
        'Dell UltraSharp U2723QE reverts to washed-out sRGB profile every time workstation wakes from sleep.',
      category: 'Hardware',
      priority: 'Low',
      status: 'Pending',
      requesterName: 'Sofia Rossi',
      requesterEmail: 'sofia.r@acme-corp.com',
      department: 'Brand Studio',
      assetTag: 'MON-DELL-712',
      assigneeId: null,
      assigneeName: null,
      notes: [
        {
          id: 'n-1049-1',
          authorName: 'System',
          authorRole: 'System',
          content: 'Ticket created in Hardware queue.',
          createdAt: hoursAgo(9.2),
        },
      ],
      createdAt: hoursAgo(9.2),
      updatedAt: hoursAgo(9.2),
      resolvedAt: null,
    },
    {
      ticketNumber: 'HD-1050',
      subject: 'Adobe Creative Cloud enterprise SSO certificate renewal warning',
      description:
        'Creative team members see a warning banner stating SAML certificate expires in 5 days.',
      category: 'Software',
      priority: 'High',
      status: 'In Progress',
      requesterName: 'Maya Lin',
      requesterEmail: 'maya.l@acme-corp.com',
      department: 'Marketing',
      assetTag: 'SW-ADOBE-SAML',
      assigneeId: 'agent-ananya',
      assigneeName: 'Ananya Deshmukh',
      notes: [
        {
          id: 'n-1050-1',
          authorName: 'Ananya Deshmukh',
          authorRole: 'Agent',
          content: 'Generated new X.509 certificate in Okta Admin; scheduling metadata upload with Adobe Admin Console.',
          createdAt: hoursAgo(2.4),
        },
      ],
      createdAt: hoursAgo(7.5),
      updatedAt: hoursAgo(2.4),
      resolvedAt: null,
    },
  ];

  return seeds.map((s) => ({
    ...s,
    id: crypto.randomUUID(),
    slaDueAt: computeSlaDue(s.createdAt, s.priority),
  }));
}

interface LocalDbShape {
  nextTicketSeq: number;
  tickets: Ticket[];
}

export interface TicketFilters {
  status?: string;
  category?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
}

class HelpDeskRepository {
  private useMongo = false;
  private TicketModel: Model<Ticket> | null = null;
  private dataFilePath = path.resolve(process.cwd(), 'data', 'helpdesk.json');

  async init(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI?.trim();
    if (mongoUri) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
        this.TicketModel =
          (mongoose.models.Ticket as Model<Ticket>) ||
          mongoose.model<Ticket>('Ticket', TicketSchema);
        this.useMongo = true;
        const count = await this.TicketModel.countDocuments();
        if (count === 0) {
          await this.TicketModel.insertMany(buildInitialTickets());
        }
        console.log('Connected to MongoDB for Help Desk persistence.');
        return;
      } catch (err) {
        console.warn('MongoDB connection failed, falling back to local document store:', err);
      }
    }

    this.ensureLocalStore();
  }

  private ensureLocalStore(): LocalDbShape {
    const dir = path.dirname(this.dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dataFilePath)) {
      const initial: LocalDbShape = {
        nextTicketSeq: 1051,
        tickets: buildInitialTickets(),
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(this.dataFilePath, 'utf8');
    return JSON.parse(raw) as LocalDbShape;
  }

  private writeLocalStore(db: LocalDbShape): void {
    fs.writeFileSync(this.dataFilePath, JSON.stringify(db, null, 2), 'utf8');
  }

  private async getAllTicketsRaw(): Promise<Ticket[]> {
    if (this.useMongo && this.TicketModel) {
      const docs = await this.TicketModel.find({}).lean();
      return docs.map((d) => ({
        id: d.id,
        ticketNumber: d.ticketNumber,
        subject: d.subject,
        description: d.description,
        category: d.category,
        priority: d.priority,
        status: d.status,
        requesterName: d.requesterName,
        requesterEmail: d.requesterEmail,
        department: d.department,
        assetTag: d.assetTag,
        assigneeId: d.assigneeId ?? null,
        assigneeName: d.assigneeName ?? null,
        resolutionSummary: d.resolutionSummary,
        notes: d.notes ?? [],
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        resolvedAt: d.resolvedAt ?? null,
        slaDueAt: d.slaDueAt,
      }));
    }
    return this.ensureLocalStore().tickets;
  }

  async listTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
    let items = await this.getAllTicketsRaw();

    if (filters.status && filters.status !== 'All') {
      items = items.filter((t) => t.status === filters.status);
    }
    if (filters.category && filters.category !== 'All') {
      items = items.filter((t) => t.category === filters.category);
    }
    if (filters.priority && filters.priority !== 'All') {
      items = items.filter((t) => t.priority === filters.priority);
    }
    if (filters.assigneeId && filters.assigneeId !== 'All') {
      if (filters.assigneeId === 'Unassigned') {
        items = items.filter((t) => !t.assigneeId);
      } else {
        items = items.filter((t) => t.assigneeId === filters.assigneeId);
      }
    }
    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.requesterName.toLowerCase().includes(q) ||
          t.requesterEmail.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          (t.assetTag ?? '').toLowerCase().includes(q)
      );
    }

    const priorityRank: Record<TicketPriority, number> = {
      Critical: 0,
      High: 1,
      Medium: 2,
      Low: 3,
    };
    const statusRank: Record<TicketStatus, number> = {
      Pending: 0,
      'In Progress': 1,
      Resolved: 2,
    };

    return items.sort((a, b) => {
      if (statusRank[a.status] !== statusRank[b.status]) {
        return statusRank[a.status] - statusRank[b.status];
      }
      if (a.status !== 'Resolved' && priorityRank[a.priority] !== priorityRank[b.priority]) {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getTicketById(id: string): Promise<Ticket | null> {
    const items = await this.getAllTicketsRaw();
    return items.find((t) => t.id === id || t.ticketNumber === id) ?? null;
  }

  async createTicket(payload: CreateTicketPayload): Promise<Ticket> {
    const now = new Date().toISOString();
    const defaultSpecialist = payload.autoAssign
      ? SUPPORT_AGENTS.find((a) => a.specialty === payload.category) ?? null
      : null;

    let ticketNumber = '';
    if (this.useMongo && this.TicketModel) {
      const latest = await this.TicketModel.find({}).select('ticketNumber').lean();
      const maxNum = latest.reduce((max, item) => {
        const parsed = parseInt(item.ticketNumber.replace(/\D/g, ''), 10);
        return Number.isFinite(parsed) && parsed > max ? parsed : max;
      }, 1050);
      ticketNumber = `HD-${maxNum + 1}`;
    } else {
      const db = this.ensureLocalStore();
      ticketNumber = `HD-${db.nextTicketSeq}`;
      db.nextTicketSeq += 1;
      this.writeLocalStore(db);
    }

    const created: Ticket = {
      id: crypto.randomUUID(),
      ticketNumber,
      subject: payload.subject.trim(),
      description: payload.description.trim(),
      category: payload.category,
      priority: payload.priority,
      status: 'Pending',
      requesterName: payload.requesterName.trim(),
      requesterEmail: payload.requesterEmail.trim(),
      department: payload.department.trim() || 'General',
      assetTag: payload.assetTag?.trim() || undefined,
      assigneeId: defaultSpecialist?.id ?? null,
      assigneeName: defaultSpecialist?.name ?? null,
      notes: [
        {
          id: crypto.randomUUID(),
          authorName: 'System',
          authorRole: 'System',
          content: defaultSpecialist
            ? `Ticket created with ${payload.priority} priority and auto-routed to ${defaultSpecialist.name} (${payload.category}).`
            : `Ticket created with ${payload.priority} priority in ${payload.category} queue.`,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      slaDueAt: computeSlaDue(now, payload.priority),
    };

    if (this.useMongo && this.TicketModel) {
      await this.TicketModel.create(created);
    } else {
      const db = this.ensureLocalStore();
      db.tickets.unshift(created);
      this.writeLocalStore(db);
    }

    return created;
  }

  async updateTicket(id: string, patch: UpdateTicketPayload): Promise<Ticket | null> {
    const existing = await this.getTicketById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const actor = patch.actorName?.trim() || 'Admin Console';
    const auditLogs: TicketNote[] = [];

    const nextStatus = patch.status ?? existing.status;
    const nextPriority = patch.priority ?? existing.priority;
    const nextCategory = patch.category ?? existing.category;

    let nextAssigneeId = existing.assigneeId;
    let nextAssigneeName = existing.assigneeName;
    if (patch.assigneeId !== undefined) {
      if (patch.assigneeId === null || patch.assigneeId === '') {
        nextAssigneeId = null;
        nextAssigneeName = null;
      } else {
        const agent = SUPPORT_AGENTS.find((a) => a.id === patch.assigneeId);
        nextAssigneeId = agent ? agent.id : patch.assigneeId;
        nextAssigneeName = agent ? agent.name : existing.assigneeName;
      }
    }

    if (patch.status && patch.status !== existing.status) {
      auditLogs.push({
        id: crypto.randomUUID(),
        authorName: actor,
        authorRole: 'System',
        content: `Status updated from ${existing.status} to ${patch.status}.`,
        createdAt: now,
      });
    }
    if (patch.priority && patch.priority !== existing.priority) {
      auditLogs.push({
        id: crypto.randomUUID(),
        authorName: actor,
        authorRole: 'System',
        content: `Priority changed from ${existing.priority} to ${patch.priority}.`,
        createdAt: now,
      });
    }
    if (patch.category && patch.category !== existing.category) {
      auditLogs.push({
        id: crypto.randomUUID(),
        authorName: actor,
        authorRole: 'System',
        content: `Category moved from ${existing.category} to ${patch.category}.`,
        createdAt: now,
      });
    }
    if (patch.assigneeId !== undefined && nextAssigneeId !== existing.assigneeId) {
      auditLogs.push({
        id: crypto.randomUUID(),
        authorName: actor,
        authorRole: 'System',
        content: nextAssigneeName
          ? `Assigned ticket to ${nextAssigneeName}.`
          : 'Ticket returned to unassigned queue.',
        createdAt: now,
      });
    }

    let resolvedAt = existing.resolvedAt;
    if (nextStatus === 'Resolved' && existing.status !== 'Resolved') {
      resolvedAt = now;
    } else if (nextStatus !== 'Resolved') {
      resolvedAt = null;
    }

    const updated: Ticket = {
      ...existing,
      status: nextStatus,
      priority: nextPriority,
      category: nextCategory,
      assigneeId: nextAssigneeId,
      assigneeName: nextAssigneeName,
      resolutionSummary:
        patch.resolutionSummary !== undefined
          ? patch.resolutionSummary.trim()
          : existing.resolutionSummary,
      slaDueAt:
        patch.priority && patch.priority !== existing.priority
          ? computeSlaDue(existing.createdAt, nextPriority)
          : existing.slaDueAt,
      notes: [...existing.notes, ...auditLogs],
      updatedAt: now,
      resolvedAt,
    };

    if (this.useMongo && this.TicketModel) {
      await this.TicketModel.updateOne({ id: existing.id }, { $set: updated });
    } else {
      const db = this.ensureLocalStore();
      const idx = db.tickets.findIndex((t) => t.id === existing.id);
      if (idx !== -1) {
        db.tickets[idx] = updated;
        this.writeLocalStore(db);
      }
    }

    return updated;
  }

  async addTicketNote(
    id: string,
    authorName: string,
    authorRole: 'Agent' | 'Requester',
    content: string
  ): Promise<Ticket | null> {
    const existing = await this.getTicketById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const note: TicketNote = {
      id: crypto.randomUUID(),
      authorName: authorName.trim() || 'Support Engineer',
      authorRole,
      content: content.trim(),
      createdAt: now,
    };

    const updated: Ticket = {
      ...existing,
      notes: [...existing.notes, note],
      updatedAt: now,
    };

    if (this.useMongo && this.TicketModel) {
      await this.TicketModel.updateOne({ id: existing.id }, { $set: updated });
    } else {
      const db = this.ensureLocalStore();
      const idx = db.tickets.findIndex((t) => t.id === existing.id);
      if (idx !== -1) {
        db.tickets[idx] = updated;
        this.writeLocalStore(db);
      }
    }

    return updated;
  }

  async deleteTicket(id: string): Promise<boolean> {
    const existing = await this.getTicketById(id);
    if (!existing) return false;

    if (this.useMongo && this.TicketModel) {
      const res = await this.TicketModel.deleteOne({ id: existing.id });
      return res.deletedCount > 0;
    }

    const db = this.ensureLocalStore();
    const before = db.tickets.length;
    db.tickets = db.tickets.filter((t) => t.id !== existing.id);
    if (db.tickets.length !== before) {
      this.writeLocalStore(db);
      return true;
    }
    return false;
  }

  async getStats(): Promise<DashboardStats> {
    const tickets = await this.getAllTicketsRaw();
    const categories: TicketCategory[] = ['Hardware', 'Software', 'Network', 'Account'];
    const priorities: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];

    const byCategory = categories.reduce(
      (acc, cat) => {
        const subset = tickets.filter((t) => t.category === cat);
        acc[cat] = {
          total: subset.length,
          pending: subset.filter((t) => t.status === 'Pending').length,
          inProgress: subset.filter((t) => t.status === 'In Progress').length,
          resolved: subset.filter((t) => t.status === 'Resolved').length,
        };
        return acc;
      },
      {} as Record<TicketCategory, CategoryBreakdown>
    );

    const byPriority = priorities.reduce(
      (acc, prio) => {
        acc[prio] = tickets.filter((t) => t.priority === prio).length;
        return acc;
      },
      {} as Record<TicketPriority, number>
    );

    const resolvedTickets = tickets.filter((t) => t.status === 'Resolved' && t.resolvedAt);
    const totalResolutionMs = resolvedTickets.reduce((sum, t) => {
      const start = new Date(t.createdAt).getTime();
      const end = new Date(t.resolvedAt as string).getTime();
      return sum + Math.max(0, end - start);
    }, 0);

    const avgResolutionHours =
      resolvedTickets.length > 0
        ? Number((totalResolutionMs / resolvedTickets.length / 3600000).toFixed(1))
        : 0;

    const withinSlaCount = tickets.filter((t) => {
      const referenceTime = t.resolvedAt ? new Date(t.resolvedAt).getTime() : Date.now();
      return referenceTime <= new Date(t.slaDueAt).getTime();
    }).length;

    const slaComplianceRate =
      tickets.length > 0 ? Math.round((withinSlaCount / tickets.length) * 100) : 100;

    const recentNotes = tickets
      .flatMap((t) =>
        t.notes.map((note) => ({
          ticketId: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          category: t.category,
          note,
        }))
      )
      .sort((a, b) => new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime())
      .slice(0, 8);

    return {
      total: tickets.length,
      pending: tickets.filter((t) => t.status === 'Pending').length,
      inProgress: tickets.filter((t) => t.status === 'In Progress').length,
      resolved: tickets.filter((t) => t.status === 'Resolved').length,
      criticalOpen: tickets.filter(
        (t) => t.priority === 'Critical' && t.status !== 'Resolved'
      ).length,
      avgResolutionHours,
      slaComplianceRate,
      byCategory,
      byPriority,
      recentNotes,
    };
  }
}

export const helpDeskRepo = new HelpDeskRepository();
