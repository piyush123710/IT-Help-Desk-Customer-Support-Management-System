import React from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import type {
  AgentProfile,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../types/helpdesk';
import { formatRelativeTime, formatSlaLabel } from '../lib/api';
import { AgentAvatar, CategoryText, PriorityText, StatusText } from './SemanticLabels';

export interface QueueFilters {
  status: TicketStatus | 'All';
  category: TicketCategory | 'All';
  priority: TicketPriority | 'All';
  assigneeId: string;
  search: string;
}

interface TicketQueueProps {
  tickets: Ticket[];
  agents: AgentProfile[];
  filters: QueueFilters;
  loading: boolean;
  error: string | null;
  onChangeFilters: (next: Partial<QueueFilters>) => void;
  onResetFilters: () => void;
  onSelectTicket: (ticket: Ticket) => void;
  onQuickStatusChange: (ticketId: string, status: TicketStatus) => void;
  onOpenNewTicket: () => void;
  onRetry: () => void;
}

const STATUS_TABS: Array<TicketStatus | 'All'> = ['All', 'Pending', 'In Progress', 'Resolved'];
const CATEGORIES: Array<TicketCategory | 'All'> = ['All', 'Hardware', 'Software', 'Network', 'Account'];
const PRIORITIES: Array<TicketPriority | 'All'> = ['All', 'Critical', 'High', 'Medium', 'Low'];

export function TicketQueue({
  tickets,
  agents,
  filters,
  loading,
  error,
  onChangeFilters,
  onResetFilters,
  onSelectTicket,
  onQuickStatusChange,
  onOpenNewTicket,
  onRetry,
}: TicketQueueProps) {
  const hasActiveFilters =
    filters.status !== 'All' ||
    filters.category !== 'All' ||
    filters.priority !== 'All' ||
    filters.assigneeId !== 'All' ||
    filters.search.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Segmented status filter control */}
        <div
          role="tablist"
          aria-label="Filter tickets by status"
          className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start overflow-x-auto max-w-full"
        >
          {STATUS_TABS.map((status) => {
            const active = filters.status === status;
            return (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeFilters({ status })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'All' ? 'All Tickets' : status}
              </button>
            );
          })}
        </div>

        {/* Search + dropdown filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => onChangeFilters({ search: e.target.value })}
              placeholder="Search ID, subject, requester..."
              aria-label="Search tickets"
              className="w-full sm:w-64 pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) =>
              onChangeFilters({ category: e.target.value as TicketCategory | 'All' })
            }
            aria-label="Filter by category"
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) =>
              onChangeFilters({ priority: e.target.value as TicketPriority | 'All' })
            }
            aria-label="Filter by priority"
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
          >
            {PRIORITIES.map((prio) => (
              <option key={prio} value={prio}>
                {prio === 'All' ? 'All Priorities' : prio}
              </option>
            ))}
          </select>

          <select
            value={filters.assigneeId}
            onChange={(e) => onChangeFilters({ assigneeId: e.target.value })}
            aria-label="Filter by assignee"
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Engineers</option>
            <option value="Unassigned">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-900">Unable to load ticket queue</p>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : loading ? (
          <div className="divide-y divide-slate-200">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-4 w-16 bg-slate-200 rounded" />
                  <div className="h-4 w-72 bg-slate-200 rounded" />
                </div>
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-900">
              {hasActiveFilters ? 'No tickets match your current filters' : 'No support tickets yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {hasActiveFilters
                ? 'Try clearing your search query or switching status and category filters.'
                : 'Submitted employee complaints, hardware requests, and technical queries will appear here.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Clear Filters
                </button>
              ) : null}
              <button
                type="button"
                onClick={onOpenNewTicket}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {hasActiveFilters ? 'Create New Ticket' : 'Log First Ticket'}
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 tracking-wide">
                  <th className="py-3 pl-6 pr-3 whitespace-nowrap">Ticket</th>
                  <th className="py-3 px-3">Issue Summary</th>
                  <th className="py-3 px-3 whitespace-nowrap">Category</th>
                  <th className="py-3 px-3 whitespace-nowrap">Priority</th>
                  <th className="py-3 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3 whitespace-nowrap">Assignee</th>
                  <th className="py-3 pl-3 pr-6 text-right whitespace-nowrap">SLA / Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {tickets.map((ticket) => {
                  const sla = formatSlaLabel(ticket);
                  const assignedAgent = agents.find((a) => a.id === ticket.assigneeId);

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 pl-6 pr-3 align-middle whitespace-nowrap">
                        <span className="font-mono text-xs font-medium text-slate-900 tabular-nums">
                          {ticket.ticketNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 align-middle min-w-[260px] max-w-md">
                        <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {ticket.requesterName} · {ticket.department}
                          {ticket.assetTag ? ` · ${ticket.assetTag}` : ''}
                        </p>
                      </td>

                      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                        <CategoryText category={ticket.category} />
                      </td>

                      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                        <PriorityText priority={ticket.priority} />
                      </td>

                      <td
                        className="py-3.5 px-3 align-middle whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <StatusText status={ticket.status} />
                          <select
                            aria-label={`Change status for ${ticket.ticketNumber}`}
                            value={ticket.status}
                            onChange={(e) =>
                              onQuickStatusChange(ticket.id, e.target.value as TicketStatus)
                            }
                            className="text-[11px] text-slate-500 bg-transparent border border-transparent hover:border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                        {assignedAgent ? (
                          <div className="flex items-center gap-2">
                            <AgentAvatar
                              name={assignedAgent.name}
                              avatarUrl={assignedAgent.avatarUrl}
                              size="sm"
                            />
                            <span className="text-xs text-slate-700">{assignedAgent.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 pl-3 pr-6 align-middle text-right whitespace-nowrap">
                        <p
                          className={`text-xs font-mono tabular-nums ${
                            sla.overdue ? 'text-red-700 font-medium' : 'text-slate-700'
                          }`}
                        >
                          {sla.text}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                          {formatRelativeTime(ticket.updatedAt)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
