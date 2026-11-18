import React, { useEffect, useState } from 'react';
import { Check, Send, Trash2, X } from 'lucide-react';
import type {
  AgentProfile,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UpdateTicketPayload,
} from '../types/helpdesk';
import { formatShortDateTime, formatSlaLabel } from '../lib/api';
import { AgentAvatar, CategoryText, PriorityText, StatusText } from './SemanticLabels';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  agents: AgentProfile[];
  onClose: () => void;
  onUpdateTicket: (id: string, patch: UpdateTicketPayload) => Promise<void>;
  onAddNote: (
    id: string,
    payload: { authorName: string; authorRole: 'Agent' | 'Requester'; content: string }
  ) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

const CATEGORIES: TicketCategory[] = ['Hardware', 'Software', 'Network', 'Account'];
const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES: TicketStatus[] = ['Pending', 'In Progress', 'Resolved'];

export function TicketDetailDrawer({
  ticket,
  agents,
  onClose,
  onUpdateTicket,
  onAddNote,
  onDeleteTicket,
}: TicketDetailDrawerProps) {
  const [resolutionText, setResolutionText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteRole, setNoteRole] = useState<'Agent' | 'Requester'>('Agent');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      setResolutionText(ticket.resolutionSummary ?? '');
      setNoteText('');
      setConfirmDelete(false);
      setErrorMsg(null);
    }
  }, [ticket]);

  if (!ticket) return null;

  const sla = formatSlaLabel(ticket);
  const assignedAgent = agents.find((a) => a.id === ticket.assigneeId);

  const handlePatch = async (patch: UpdateTicketPayload) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await onUpdateTicket(ticket.id, { ...patch, actorName: 'Ananya Deshmukh' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update ticket.');
    } finally {
      setSaving(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resolutionText.trim().length < 5) {
      setErrorMsg('Please enter a brief resolution summary (at least 5 characters).');
      return;
    }
    await handlePatch({
      status: 'Resolved',
      resolutionSummary: resolutionText.trim(),
    });
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await onAddNote(ticket.id, {
        authorName:
          noteRole === 'Agent'
            ? assignedAgent?.name || 'Ananya Deshmukh'
            : ticket.requesterName,
        authorRole: noteRole,
        content: noteText.trim(),
      });
      setNoteText('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to post worklog update.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await onDeleteTicket(ticket.id);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete ticket.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-slate-900/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-2xl bg-white h-full border-l border-slate-200 flex flex-col shadow-xl">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-slate-500 min-w-0">
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {ticket.ticketNumber}
            </span>
            <span aria-hidden="true">·</span>
            <StatusText status={ticket.status} />
            <span aria-hidden="true">·</span>
            <span
              className={`font-mono tabular-nums ${
                sla.overdue ? 'text-red-700 font-medium' : 'text-slate-500'
              }`}
            >
              {sla.text}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label="Close ticket details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {errorMsg}
            </div>
          )}

          {/* Subject & Description */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mb-2">
              <CategoryText category={ticket.category} />
              <span aria-hidden="true">·</span>
              <PriorityText priority={ticket.priority} />
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Opened {formatShortDateTime(ticket.createdAt)}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 leading-snug">
              {ticket.subject}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed mt-3 whitespace-pre-line">
              {ticket.description}
            </p>
          </div>

          {/* Requester Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-slate-200 text-xs">
            <div>
              <p className="text-slate-500">Requester</p>
              <p className="font-medium text-slate-900 mt-1">{ticket.requesterName}</p>
              <p className="text-slate-500 mt-0.5 truncate">{ticket.requesterEmail}</p>
            </div>
            <div>
              <p className="text-slate-500">Department</p>
              <p className="font-medium text-slate-900 mt-1">{ticket.department}</p>
            </div>
            <div>
              <p className="text-slate-500">Asset / System Tag</p>
              <p className="font-mono font-medium text-slate-900 mt-1">
                {ticket.assetTag || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Triage & Routing Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="drawer-status"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Workflow Status
              </label>
              <select
                id="drawer-status"
                disabled={saving}
                value={ticket.status}
                onChange={(e) => handlePatch({ status: e.target.value as TicketStatus })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="drawer-priority"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Priority Assignment
              </label>
              <select
                id="drawer-priority"
                disabled={saving}
                value={ticket.priority}
                onChange={(e) => handlePatch({ priority: e.target.value as TicketPriority })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="drawer-category"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Category Queue
              </label>
              <select
                id="drawer-category"
                disabled={saving}
                value={ticket.category}
                onChange={(e) => handlePatch({ category: e.target.value as TicketCategory })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="drawer-assignee"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Assigned Engineer
              </label>
              <select
                id="drawer-assignee"
                disabled={saving}
                value={ticket.assigneeId ?? ''}
                onChange={(e) =>
                  handlePatch({ assigneeId: e.target.value ? e.target.value : null })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue Resolution Workflow */}
          <form
            onSubmit={handleResolveSubmit}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="resolution-summary"
                className="text-xs font-semibold text-slate-900"
              >
                Resolution Summary
              </label>
              {ticket.resolvedAt && (
                <span className="text-[11px] font-mono text-emerald-700 tabular-nums">
                  Resolved {formatShortDateTime(ticket.resolvedAt)}
                </span>
              )}
            </div>
            <textarea
              id="resolution-summary"
              rows={3}
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Document root cause, remediation steps, or hardware replacement details..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Saves summary and marks ticket as Resolved
              </span>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{ticket.status === 'Resolved' ? 'Update Resolution' : 'Resolve Ticket'}</span>
              </button>
            </div>
          </form>

          {/* Worklog & Audit Trail */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Worklog & Audit Trail</h3>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {ticket.notes.map((note) => {
                const agentMatch = agents.find((a) => a.name === note.authorName);
                return (
                  <div key={note.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {note.authorRole === 'Agent' && (
                          <AgentAvatar
                            name={note.authorName}
                            avatarUrl={agentMatch?.avatarUrl}
                            size="sm"
                          />
                        )}
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {note.authorName}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{note.authorRole}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                        {formatShortDateTime(note.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm mt-1.5 ${
                        note.authorRole === 'System' ? 'text-slate-500' : 'text-slate-800'
                      }`}
                    >
                      {note.content}
                    </p>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleNoteSubmit} className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="new-worklog-note" className="text-xs font-medium text-slate-600">
                  Add Reply or Investigation Note
                </label>
                <select
                  aria-label="Reply author role"
                  value={noteRole}
                  onChange={(e) => setNoteRole(e.target.value as 'Agent' | 'Requester')}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-600"
                >
                  <option value="Agent">As Support Engineer</option>
                  <option value="Requester">As Customer / Requester</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  id="new-worklog-note"
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write troubleshooting update or customer follow-up..."
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={saving || !noteText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Post</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-800"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Delete Ticket</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-700 font-medium">Permanently delete?</span>
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-700 rounded-md hover:bg-red-800"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
