import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { AgentProfile, Ticket } from '../types/helpdesk';
import { AgentAvatar, CategoryText } from './SemanticLabels';

interface TeamRoutingViewProps {
  agents: AgentProfile[];
  tickets: Ticket[];
  onFilterByAgent: (agentId: string) => void;
}

export function TeamRoutingView({
  agents,
  tickets,
  onFilterByAgent,
}: TeamRoutingViewProps) {
  const unassignedCount = tickets.filter(
    (t) => !t.assigneeId && t.status !== 'Resolved'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Support Engineers & Category Routing
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Active ticket workload across Hardware, Software, Network, and Account specialists.
          </p>
        </div>
        {unassignedCount > 0 && (
          <button
            type="button"
            onClick={() => onFilterByAgent('Unassigned')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <span className="font-mono tabular-nums">{unassignedCount}</span>
            <span>unassigned open tickets</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const assigned = tickets.filter((t) => t.assigneeId === agent.id);
          const pending = assigned.filter((t) => t.status === 'Pending').length;
          const inProgress = assigned.filter((t) => t.status === 'In Progress').length;
          const resolved = assigned.filter((t) => t.status === 'Resolved').length;

          return (
            <div
              key={agent.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <AgentAvatar name={agent.name} avatarUrl={agent.avatarUrl} size="lg" />
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{agent.role}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                      {agent.email}
                    </p>
                  </div>
                </div>
                <CategoryText category={agent.specialty} />
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 pt-4 text-left">
                <div>
                  <p className="text-xs text-slate-500">Pending</p>
                  <p className="text-xl font-semibold font-mono tabular-nums text-amber-700 mt-0.5">
                    {pending}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">In Progress</p>
                  <p className="text-xl font-semibold font-mono tabular-nums text-blue-700 mt-0.5">
                    {inProgress}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Resolved</p>
                  <p className="text-xl font-semibold font-mono tabular-nums text-emerald-700 mt-0.5">
                    {resolved}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Primary Queue: {agent.specialty}
                </span>
                <button
                  type="button"
                  onClick={() => onFilterByAgent(agent.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                >
                  <span>View Assigned</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
