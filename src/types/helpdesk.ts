export type TicketCategory = 'Hardware' | 'Software' | 'Network' | 'Account';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  specialty: TicketCategory;
  email: string;
  avatarUrl: string;
}

export interface TicketNote {
  id: string;
  authorName: string;
  authorRole: 'Agent' | 'Requester' | 'System';
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requesterName: string;
  requesterEmail: string;
  department: string;
  assetTag?: string;
  assigneeId: string | null;
  assigneeName: string | null;
  resolutionSummary?: string;
  notes: TicketNote[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  slaDueAt: string;
}

export interface CategoryBreakdown {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  criticalOpen: number;
  avgResolutionHours: number;
  slaComplianceRate: number;
  byCategory: Record<TicketCategory, CategoryBreakdown>;
  byPriority: Record<TicketPriority, number>;
  recentNotes: Array<{
    ticketId: string;
    ticketNumber: string;
    subject: string;
    category: TicketCategory;
    note: TicketNote;
  }>;
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  requesterName: string;
  requesterEmail: string;
  department: string;
  assetTag?: string;
  autoAssign?: boolean;
}

export interface UpdateTicketPayload {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigneeId?: string | null;
  resolutionSummary?: string;
  actorName?: string;
}
