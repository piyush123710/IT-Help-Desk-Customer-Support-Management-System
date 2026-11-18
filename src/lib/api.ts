import type {
  AgentProfile,
  CreateTicketPayload,
  DashboardStats,
  Ticket,
  UpdateTicketPayload,
} from '../types/helpdesk';

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export interface TicketQueryParams {
  status?: string;
  category?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
}

export const helpDeskApi = {
  getAgents: () => requestJson<{ agents: AgentProfile[] }>('/api/agents'),
  getStats: () => requestJson<DashboardStats>('/api/stats'),
  getTickets: (params: TicketQueryParams = {}) => {
    const qs = new URLSearchParams();
    if (params.status && params.status !== 'All') qs.set('status', params.status);
    if (params.category && params.category !== 'All') qs.set('category', params.category);
    if (params.priority && params.priority !== 'All') qs.set('priority', params.priority);
    if (params.assigneeId && params.assigneeId !== 'All') {
      qs.set('assigneeId', params.assigneeId);
    }
    if (params.search && params.search.trim()) qs.set('search', params.search.trim());
    const query = qs.toString();
    return requestJson<{ tickets: Ticket[] }>(`/api/tickets${query ? `?${query}` : ''}`);
  },
  getTicket: (id: string) => requestJson<{ ticket: Ticket }>(`/api/tickets/${id}`),
  createTicket: (payload: CreateTicketPayload) =>
    requestJson<{ ticket: Ticket }>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTicket: (id: string, patch: UpdateTicketPayload) =>
    requestJson<{ ticket: Ticket }>(`/api/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  addNote: (
    id: string,
    payload: { authorName: string; authorRole: 'Agent' | 'Requester'; content: string }
  ) =>
    requestJson<{ ticket: Ticket }>(`/api/tickets/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteTicket: (id: string) =>
    requestJson<{ ok: boolean }>(`/api/tickets/${id}`, {
      method: 'DELETE',
    }),
};

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const absMins = Math.round(Math.abs(diffMs) / 60000);
  if (absMins < 1) return 'Just now';
  if (absMins < 60) return diffMs >= 0 ? `${absMins}m ago` : `in ${absMins}m`;
  const hours = Math.round(absMins / 60);
  if (hours < 24) return diffMs >= 0 ? `${hours}h ago` : `in ${hours}h`;
  const days = Math.round(hours / 24);
  return diffMs >= 0 ? `${days}d ago` : `in ${days}d`;
}

export function formatShortDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatSlaLabel(ticket: Ticket): { text: string; overdue: boolean } {
  if (ticket.status === 'Resolved') {
    return { text: 'Closed', overdue: false };
  }
  const diffMs = new Date(ticket.slaDueAt).getTime() - Date.now();
  const absMins = Math.round(Math.abs(diffMs) / 60000);
  if (diffMs < 0) {
    const hrs = Math.floor(absMins / 60);
    const mins = absMins % 60;
    return {
      text: hrs > 0 ? `Overdue ${hrs}h ${mins}m` : `Overdue ${mins}m`,
      overdue: true,
    };
  }
  const hrs = Math.floor(absMins / 60);
  const mins = absMins % 60;
  return {
    text: hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`,
    overdue: false,
  };
}

export function exportTicketsToCsv(tickets: Ticket[]): void {
  const headers = [
    'Ticket ID',
    'Subject',
    'Category',
    'Priority',
    'Status',
    'Requester',
    'Email',
    'Department',
    'Assignee',
    'Asset Tag',
    'Created At',
    'Resolved At',
  ];
  const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const rows = tickets.map((t) =>
    [
      t.ticketNumber,
      t.subject,
      t.category,
      t.priority,
      t.status,
      t.requesterName,
      t.requesterEmail,
      t.department,
      t.assigneeName ?? 'Unassigned',
      t.assetTag ?? '',
      t.createdAt,
      t.resolvedAt ?? '',
    ]
      .map(escapeCell)
      .join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deskline-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
