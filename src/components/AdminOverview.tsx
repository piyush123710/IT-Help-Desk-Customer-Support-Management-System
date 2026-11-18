import React from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import type { DashboardStats, Ticket, TicketCategory, TicketStatus } from '../types/helpdesk';
import { formatRelativeTime, formatSlaLabel } from '../lib/api';
import { CategoryText, PriorityText, StatusText } from './SemanticLabels';

interface AdminOverviewProps {
  stats: DashboardStats | null;
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onFilterNavigate: (filters: { status?: TicketStatus | 'All'; category?: TicketCategory | 'All' }) => void;
  onSelectTicket: (ticket: Ticket) => void;
}

const CATEGORIES: TicketCategory[] = ['Hardware', 'Software', 'Network', 'Account'];

export function AdminOverview({
  stats,
  tickets,
  loading,
  error,
  onRetry,
  onFilterNavigate,
  onSelectTicket,
}: AdminOverviewProps) {
  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-sm font-medium text-slate-900">Unable to load dashboard metrics</p>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-6 space-y-2 animate-pulse">
              <div className="h-3.5 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-200 rounded" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl h-80 animate-pulse" />
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  const urgentTickets = tickets
    .filter((t) => t.status !== 'Resolved')
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Support Operations Summary
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor pending intake, ongoing investigations, and resolved incidents across all IT queues.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onFilterNavigate({ status: 'All', category: 'All' })}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <span>Open Full Queue</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* 4-column single-elevation hairline KPI strip */}
      <section
        aria-label="Key metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
      >
        <button
          type="button"
          onClick={() => onFilterNavigate({ status: 'All', category: 'All' })}
          className="p-6 text-left hover:bg-slate-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none"
        >
          <p className="text-xs font-medium text-slate-500">Total Tickets</p>
          <p className="text-3xl font-semibold text-slate-900 mt-2 font-mono tabular-nums">
            {stats.total}
          </p>
          <p className="text-xs text-slate-500 mt-2 tabular-nums">
            {stats.slaComplianceRate}% within SLA target
          </p>
        </button>

        <button
          type="button"
          onClick={() => onFilterNavigate({ status: 'Pending', category: 'All' })}
          className="p-6 text-left hover:bg-slate-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <p className="text-xs font-medium text-slate-500">Pending Triage</p>
          <p className="text-3xl font-semibold text-amber-700 mt-2 font-mono tabular-nums">
            {stats.pending}
          </p>
          <p className="text-xs text-slate-500 mt-2 tabular-nums">
            {stats.criticalOpen} critical open issues
          </p>
        </button>

        <button
          type="button"
          onClick={() => onFilterNavigate({ status: 'In Progress', category: 'All' })}
          className="p-6 text-left hover:bg-slate-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <p className="text-xs font-medium text-slate-500">In Progress</p>
          <p className="text-3xl font-semibold text-blue-700 mt-2 font-mono tabular-nums">
            {stats.inProgress}
          </p>
          <p className="text-xs text-slate-500 mt-2">Actively assigned to engineers</p>
        </button>

        <button
          type="button"
          onClick={() => onFilterNavigate({ status: 'Resolved', category: 'All' })}
          className="p-6 text-left hover:bg-slate-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded-b-xl sm:rounded-r-xl sm:rounded-bl-none"
        >
          <p className="text-xs font-medium text-slate-500">Resolved Issues</p>
          <p className="text-3xl font-semibold text-emerald-700 mt-2 font-mono tabular-nums">
            {stats.resolved}
          </p>
          <p className="text-xs text-slate-500 mt-2 tabular-nums">
            {stats.avgResolutionHours}h average resolution time
          </p>
        </button>
      </section>

      {/* Category Distribution & Active Queue Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Tickets by Category</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any category row to filter the ticket queue
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
              <span>Pending</span>
              <span aria-hidden="true">·</span>
              <span>In Progress</span>
              <span aria-hidden="true">·</span>
              <span>Resolved</span>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {CATEGORIES.map((cat) => {
              const row = stats.byCategory[cat];
              const total = Math.max(row.total, 1);
              const pendingPct = (row.pending / total) * 100;
              const progressPct = (row.inProgress / total) * 100;
              const resolvedPct = (row.resolved / total) * 100;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onFilterNavigate({ category: cat, status: 'All' })}
                  className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <div className="flex items-center justify-between gap-4 mb-2.5">
                    <CategoryText category={cat} />
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
                      <span className="text-amber-700">{row.pending} pending</span>
                      <span className="text-slate-300" aria-hidden="true">
                        /
                      </span>
                      <span className="text-blue-700">{row.inProgress} active</span>
                      <span className="text-slate-300" aria-hidden="true">
                        /
                      </span>
                      <span className="text-emerald-700">{row.resolved} resolved</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    {row.pending > 0 && (
                      <div
                        style={{ width: `${pendingPct}%` }}
                        className="bg-amber-500 h-full"
                      />
                    )}
                    {row.inProgress > 0 && (
                      <div
                        style={{ width: `${progressPct}%` }}
                        className="bg-blue-600 h-full"
                      />
                    )}
                    {row.resolved > 0 && (
                      <div
                        style={{ width: `${resolvedPct}%` }}
                        className="bg-emerald-600 h-full"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Priority Watchlist</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Open issues ordered by severity and SLA
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {urgentTickets.length} open
            </span>
          </div>

          {urgentTickets.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-900">All open tickets cleared</p>
              <p className="text-xs text-slate-500 mt-1">
                No pending or in-progress tickets require attention right now.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {urgentTickets.map((ticket) => {
                const sla = formatSlaLabel(ticket);
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => onSelectTicket(ticket)}
                    className="w-full px-6 py-3.5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                        <span className="font-mono font-medium text-slate-900 tabular-nums">
                          {ticket.ticketNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <PriorityText priority={ticket.priority} />
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{ticket.category}</span>
                      </div>
                      <span
                        className={`text-xs font-mono tabular-nums shrink-0 ${
                          sla.overdue ? 'text-red-700 font-medium' : 'text-slate-500'
                        }`}
                      >
                        {sla.text}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mt-1 line-clamp-1">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1.5 text-xs text-slate-500">
                      <span className="truncate">
                        {ticket.requesterName} · {ticket.department}
                      </span>
                      <StatusText status={ticket.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Recent Activity Log */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Resolution & Worklog Activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest updates across ticket triage, engineer assignments, and closures
            </p>
          </div>
        </div>
        {stats.recentNotes.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No recent worklog entries.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {stats.recentNotes.slice(0, 6).map((entry) => {
              const matchedTicket = tickets.find((t) => t.id === entry.ticketId);
              return (
                <div
                  key={entry.note.id}
                  className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => matchedTicket && onSelectTicket(matchedTicket)}
                        className="font-mono font-medium text-blue-700 hover:underline tabular-nums"
                      >
                        {entry.ticketNumber}
                      </button>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700">{entry.note.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.category}</span>
                    </div>
                    <p className="text-sm text-slate-800 mt-0.5">{entry.note.content}</p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono tabular-nums shrink-0">
                    {formatRelativeTime(entry.note.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
