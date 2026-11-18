import React from 'react';
import { Download, Menu, Plus } from 'lucide-react';
import type { NavView } from './Sidebar';

interface TopHeaderProps {
  activeView: NavView;
  onOpenMobileMenu: () => void;
  onOpenNewTicket: () => void;
  onExportCsv?: () => void;
  showExport?: boolean;
}

const VIEW_TITLES: Record<NavView, string> = {
  overview: 'Overview',
  tickets: 'Ticket Queue',
  submit: 'Submit Ticket',
  team: 'Team & Routing',
};

export function TopHeader({
  activeView,
  onOpenMobileMenu,
  onOpenNewTicket,
  onExportCsv,
  showExport,
}: TopHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-500 whitespace-nowrap">Help Desk</span>
          <span className="text-slate-300" aria-hidden="true">
            /
          </span>
          <h1 className="font-semibold text-slate-900 truncate">{VIEW_TITLES[activeView]}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {showExport && onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenNewTicket}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>New Ticket</span>
        </button>
      </div>
    </header>
  );
}
