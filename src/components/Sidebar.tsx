import React from 'react';
import {
  Inbox,
  LayoutDashboard,
  PlusCircle,
  Users,
  X,
} from 'lucide-react';
import { AgentAvatar } from './SemanticLabels';

export type NavView = 'overview' | 'tickets' | 'submit' | 'team';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  counts: {
    pending: number;
    inProgress: number;
    total: number;
  };
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tickets', label: 'Tickets', icon: Inbox },
  { id: 'submit', label: 'Submit Ticket', icon: PlusCircle },
  { id: 'team', label: 'Team & Routing', icon: Users },
];

export function Sidebar({
  activeView,
  onSelectView,
  counts,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 shrink-0">
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('overview');
            onCloseMobile();
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Deskline
        </a>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          const openCount = counts.pending + counts.inProgress;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600 ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'tickets' && (
                <span
                  className={`text-xs font-mono tabular-nums ${
                    active ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {openCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <AgentAvatar
            name="Ananya Deshmukh"
            avatarUrl="/src/assets/images/avatar_admin_lead_1794995923654.jpg"
            size="md"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Ananya Deshmukh</p>
            <p className="text-xs text-slate-500 truncate">IT Operations Lead</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{navContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{navContent}</div>
        </div>
      )}
    </>
  );
}
