import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Globe,
  HardDrive,
  KeyRound,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import type { TicketCategory, TicketPriority, TicketStatus } from '../types/helpdesk';

export function StatusText({ status }: { status: TicketStatus }) {
  if (status === 'Pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Pending</span>
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 whitespace-nowrap">
        <Loader2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>In Progress</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Resolved</span>
    </span>
  );
}

export function PriorityText({ priority }: { priority: TicketPriority }) {
  if (priority === 'Critical') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 whitespace-nowrap">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Critical</span>
      </span>
    );
  }
  if (priority === 'High') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>High</span>
      </span>
    );
  }
  if (priority === 'Medium') {
    return <span className="text-xs font-medium text-slate-700 whitespace-nowrap">Medium</span>;
  }
  return <span className="text-xs font-normal text-slate-500 whitespace-nowrap">Low</span>;
}

export function CategoryText({ category }: { category: TicketCategory }) {
  const icons: Record<TicketCategory, React.ReactNode> = {
    Hardware: <HardDrive className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />,
    Software: <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />,
    Network: <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />,
    Account: <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />,
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
      {icons[category]}
      <span>{category}</span>
    </span>
  );
}

export function AgentAvatar({
  name,
  avatarUrl,
  size = 'sm',
}: {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClass =
    size === 'lg'
      ? 'w-11 h-11 text-sm'
      : size === 'md'
        ? 'w-8 h-8 text-xs'
        : 'w-6 h-6 text-[11px]';

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!avatarUrl || imgFailed) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center shrink-0 select-none`}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`${sizeClass} rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100`}
    />
  );
}
