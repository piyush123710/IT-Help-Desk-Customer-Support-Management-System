import React, { useState } from 'react';
import { CheckCircle2, Cpu, Globe, HardDrive, KeyRound, X } from 'lucide-react';
import type {
  CreateTicketPayload,
  Ticket,
  TicketCategory,
  TicketPriority,
} from '../types/helpdesk';

interface TicketFormProps {
  onSubmit: (payload: CreateTicketPayload) => Promise<Ticket>;
  onCancel?: () => void;
  onViewTicket?: (ticket: Ticket) => void;
  isModal?: boolean;
}

const CATEGORY_OPTIONS: Array<{
  id: TicketCategory;
  title: string;
  examples: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'Hardware',
    title: 'Hardware',
    examples: 'Laptops, monitors, docks, peripherals',
    icon: HardDrive,
  },
  {
    id: 'Software',
    title: 'Software',
    examples: 'OS updates, SaaS licenses, IDE crashes',
    icon: Cpu,
  },
  {
    id: 'Network',
    title: 'Network',
    examples: 'VPN tunnels, Wi-Fi, DNS, firewall',
    icon: Globe,
  },
  {
    id: 'Account',
    title: 'Account',
    examples: 'SSO, MFA resets, role permissions',
    icon: KeyRound,
  },
];

const PRIORITY_OPTIONS: Array<{
  id: TicketPriority;
  slaHint: string;
}> = [
  { id: 'Low', slaHint: '72h SLA' },
  { id: 'Medium', slaHint: '24h SLA' },
  { id: 'High', slaHint: '8h SLA' },
  { id: 'Critical', slaHint: '2h SLA' },
];

export function TicketForm({
  onSubmit,
  onCancel,
  onViewTicket,
  isModal = false,
}: TicketFormProps) {
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [category, setCategory] = useState<TicketCategory>('Software');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [subject, setSubject] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [description, setDescription] = useState('');
  const [autoAssign, setAutoAssign] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const created = await onSubmit({
        requesterName,
        requesterEmail,
        department,
        category,
        priority,
        subject,
        assetTag: assetTag.trim() || undefined,
        description,
        autoAssign,
      });
      setCreatedTicket(created);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCreatedTicket(null);
    setSubject('');
    setAssetTag('');
    setDescription('');
    setErrorMsg(null);
  };

  if (createdTicket) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-mono font-semibold text-emerald-700 tabular-nums">
            {createdTicket.ticketNumber}
          </p>
          <h3 className="text-lg font-semibold text-slate-900 mt-1">
            Support Ticket Logged
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {createdTicket.assigneeName
              ? `Routed to ${createdTicket.assigneeName} in the ${createdTicket.category} queue.`
              : `Added to the ${createdTicket.category} triage queue.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onViewTicket && (
            <button
              type="button"
              onClick={() => onViewTicket(createdTicket)}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Inspect Ticket
            </button>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Submit Another
          </button>
          {isModal && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="req-name"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Requester Name
          </label>
          <input
            id="req-name"
            type="text"
            required
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder="e.g., Jordan Patel"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="req-email"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Work Email
          </label>
          <input
            id="req-email"
            type="email"
            required
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
            placeholder="jordan.p@company.com"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="req-dept"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Department
          </label>
          <input
            id="req-dept"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Engineering, Finance..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Category Picker */}
      <div>
        <span className="block text-xs font-medium text-slate-700 mb-2">
          Issue Category
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = category === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCategory(opt.id)}
                className={`p-3.5 text-left border rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  active
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 ${active ? 'text-blue-700' : 'text-slate-500'}`}
                  />
                  <span className="text-sm font-semibold text-slate-900">{opt.title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{opt.examples}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority Picker + Asset Tag */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
        <div className="sm:col-span-8">
          <span className="block text-xs font-medium text-slate-700 mb-2">
            Priority Level
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIORITY_OPTIONS.map((p) => {
              const active = priority === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`px-3 py-2 text-left border rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
                    active
                      ? 'border-blue-600 bg-blue-50/50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-semibold">{p.id}</p>
                  <p className="text-[11px] font-mono text-slate-500">{p.slaHint}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:col-span-4">
          <label
            htmlFor="asset-tag"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Asset / Device Tag (Optional)
          </label>
          <input
            id="asset-tag"
            type="text"
            value={assetTag}
            onChange={(e) => setAssetTag(e.target.value)}
            placeholder="e.g., LT-4409-X1"
            className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="ticket-subject"
          className="block text-xs font-medium text-slate-700 mb-1.5"
        >
          Issue Subject
        </label>
        <input
          id="ticket-subject"
          type="text"
          required
          minLength={4}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Concise summary of the technical issue or request"
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label
          htmlFor="ticket-description"
          className="block text-xs font-medium text-slate-700 mb-1.5"
        >
          Detailed Description & Reproduction Steps
        </label>
        <textarea
          id="ticket-description"
          rows={4}
          required
          minLength={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe error messages, affected services, hardware symptoms, or account permissions needed..."
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoAssign}
            onChange={(e) => setAutoAssign(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
          <span>Auto-route to {category} queue specialist</span>
        </label>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {submitting ? 'Submitting...' : 'Submit Support Ticket'}
          </button>
        </div>
      </div>
    </form>
  );
}

export function NewTicketModal({
  open,
  onClose,
  onSubmit,
  onViewTicket,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTicketPayload) => Promise<Ticket>;
  onViewTicket: (ticket: Ticket) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Create Support Ticket</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Log a customer complaint or internal IT request
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <TicketForm
            isModal
            onSubmit={onSubmit}
            onCancel={onClose}
            onViewTicket={(t) => {
              onClose();
              onViewTicket(t);
            }}
          />
        </div>
      </div>
    </div>
  );
}
