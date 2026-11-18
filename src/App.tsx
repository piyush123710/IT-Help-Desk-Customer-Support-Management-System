import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar, type NavView } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { AdminOverview } from './components/AdminOverview';
import { TicketQueue, type QueueFilters } from './components/TicketQueue';
import { TicketDetailDrawer } from './components/TicketDetailDrawer';
import { NewTicketModal, TicketForm } from './components/TicketForm';
import { TeamRoutingView } from './components/TeamRoutingView';
import { exportTicketsToCsv, helpDeskApi } from './lib/api';
import type {
  AgentProfile,
  CreateTicketPayload,
  DashboardStats,
  Ticket,
  TicketCategory,
  TicketStatus,
  UpdateTicketPayload,
} from './types/helpdesk';

const DEFAULT_FILTERS: QueueFilters = {
  status: 'All',
  category: 'All',
  priority: 'All',
  assigneeId: 'All',
  search: '',
};

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);

  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState<QueueFilters>(DEFAULT_FILTERS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setError(null);
    try {
      const [agentsRes, statsRes, ticketsRes] = await Promise.all([
        helpDeskApi.getAgents(),
        helpDeskApi.getStats(),
        helpDeskApi.getTickets(),
      ]);
      setAgents(agentsRes.agents);
      setStats(statsRes);
      setAllTickets(ticketsRes.tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Help Desk API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (filters.status !== 'All' && t.status !== filters.status) return false;
      if (filters.category !== 'All' && t.category !== filters.category) return false;
      if (filters.priority !== 'All' && t.priority !== filters.priority) return false;
      if (filters.assigneeId !== 'All') {
        if (filters.assigneeId === 'Unassigned' && t.assigneeId) return false;
        if (filters.assigneeId !== 'Unassigned' && t.assigneeId !== filters.assigneeId) {
          return false;
        }
      }
      if (filters.search.trim().length > 0) {
        const q = filters.search.trim().toLowerCase();
        const matches =
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.requesterName.toLowerCase().includes(q) ||
          t.requesterEmail.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          (t.assetTag ?? '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allTickets, filters]);

  const selectedTicket = useMemo(
    () => allTickets.find((t) => t.id === selectedTicketId) ?? null,
    [allTickets, selectedTicketId]
  );

  const handleCreateTicket = async (payload: CreateTicketPayload): Promise<Ticket> => {
    const res = await helpDeskApi.createTicket(payload);
    await refreshData();
    return res.ticket;
  };

  const handleUpdateTicket = async (id: string, patch: UpdateTicketPayload) => {
    await helpDeskApi.updateTicket(id, patch);
    await refreshData();
  };

  const handleQuickStatusChange = async (ticketId: string, status: TicketStatus) => {
    await handleUpdateTicket(ticketId, { status, actorName: 'Ananya Deshmukh' });
  };

  const handleAddNote = async (
    id: string,
    payload: { authorName: string; authorRole: 'Agent' | 'Requester'; content: string }
  ) => {
    await helpDeskApi.addNote(id, payload);
    await refreshData();
  };

  const handleDeleteTicket = async (id: string) => {
    await helpDeskApi.deleteTicket(id);
    if (selectedTicketId === id) {
      setSelectedTicketId(null);
    }
    await refreshData();
  };

  const handleNavigateWithFilters = (next: {
    status?: TicketStatus | 'All';
    category?: TicketCategory | 'All';
    assigneeId?: string;
  }) => {
    setFilters({
      ...DEFAULT_FILTERS,
      ...next,
    });
    setActiveView('tickets');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        counts={{
          pending: stats?.pending ?? 0,
          inProgress: stats?.inProgress ?? 0,
          total: stats?.total ?? 0,
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          activeView={activeView}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewTicket={() => setNewTicketModalOpen(true)}
          showExport={activeView === 'tickets' && filteredTickets.length > 0}
          onExportCsv={() => exportTicketsToCsv(filteredTickets)}
        />

        <main className="flex-1 px-4 sm:px-8 py-7 max-w-[1440px] w-full mx-auto">
          {activeView === 'overview' && (
            <AdminOverview
              stats={stats}
              tickets={allTickets}
              loading={loading}
              error={error}
              onRetry={refreshData}
              onFilterNavigate={(f) => handleNavigateWithFilters(f)}
              onSelectTicket={(ticket) => setSelectedTicketId(ticket.id)}
            />
          )}

          {activeView === 'tickets' && (
            <TicketQueue
              tickets={filteredTickets}
              agents={agents}
              filters={filters}
              loading={loading}
              error={error}
              onChangeFilters={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
              onResetFilters={() => setFilters(DEFAULT_FILTERS)}
              onSelectTicket={(ticket) => setSelectedTicketId(ticket.id)}
              onQuickStatusChange={handleQuickStatusChange}
              onOpenNewTicket={() => setNewTicketModalOpen(true)}
              onRetry={refreshData}
            />
          )}

          {activeView === 'submit' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Submit IT Support Request
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Report hardware defects, software access issues, network outages, or account lockouts.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
                <TicketForm
                  onSubmit={handleCreateTicket}
                  onViewTicket={(ticket) => {
                    setActiveView('tickets');
                    setSelectedTicketId(ticket.id);
                  }}
                />
              </div>
            </div>
          )}

          {activeView === 'team' && (
            <TeamRoutingView
              agents={agents}
              tickets={allTickets}
              onFilterByAgent={(agentId) => handleNavigateWithFilters({ assigneeId: agentId })}
            />
          )}
        </main>
      </div>

      <TicketDetailDrawer
        ticket={selectedTicket}
        agents={agents}
        onClose={() => setSelectedTicketId(null)}
        onUpdateTicket={handleUpdateTicket}
        onAddNote={handleAddNote}
        onDeleteTicket={handleDeleteTicket}
      />

      <NewTicketModal
        open={newTicketModalOpen}
        onClose={() => setNewTicketModalOpen(false)}
        onSubmit={handleCreateTicket}
        onViewTicket={(ticket) => {
          setActiveView('tickets');
          setSelectedTicketId(ticket.id);
        }}
      />
    </div>
  );
}
