'use client';
/**
 * Compliance page primitives — shared across all 7 compliance surfaces.
 *
 * Keeps each individual page (form-f, aerb, pregnancy, mammo, bmw,
 * biosafety, plus the hub) focused on its data shape + form fields rather
 * than on layout, styling, and API boilerplate.
 */

import { ReactNode, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, X, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

export const TEAL = '#0D7C66';
export const NAVY = '#1E3A5F';
export const AMBER = '#F59E0B';

export const inputCls =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';
export const labelCls =
  'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

/**
 * Page header with title, description, and an action button.
 */
export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Compact status pill used across lists and status tiles.
 */
export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const styles: Record<string, string> = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    bad: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const icons: Record<string, any> = { good: CheckCircle2, warn: AlertTriangle, bad: ShieldAlert, neutral: ShieldCheck };
  const Icon = icons[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${styles[tone]}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

/**
 * Modal shell — used by all 6 surfaces for their "create" form.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  saving,
  onSave,
  saveLabel = 'Save',
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  saving: boolean;
  onSave: () => void;
  saveLabel?: string;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold shadow-sm disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple labelled input — single source of truth for form styling.
 */
export function Field({
  label,
  required,
  children,
  span = 1,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Checkbox with label — used heavily in biosafety and pregnancy screening.
 */
export function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5 py-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0D7C66] focus:ring-[#0D7C66] cursor-pointer"
      />
      <span className="text-sm text-slate-700 leading-snug group-hover:text-slate-900">{label}</span>
    </label>
  );
}

/**
 * Skeleton-aware data table. Rows are rendered by the caller.
 */
export function DataTable({
  columns,
  rows,
  loading,
  empty = 'No records yet',
}: {
  columns: string[];
  rows: ReactNode[][];
  loading: boolean;
  empty?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  {r.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-slate-700">{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Thin wrapper around GET + useEffect — every compliance page lists records
 * on mount, so this consolidates the boilerplate.
 */
export function useList<T = any>(path: string, params?: Record<string, any>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(path, { params });
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (mounted) setRows(data);
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick]);

  return { rows, loading, reload: () => setTick((t) => t + 1) };
}

/**
 * Small helper: format ISO date → "15 Apr 2026" for Indian users.
 */
export function fmtDate(d?: string | Date | null): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Format a datetime with time for audit trail displays.
 */
export function fmtDateTime(d?: string | Date | null): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Common error extractor for compliance API calls — backend returns
 * ForbiddenException with a human message from the guard, so surface that
 * verbatim to the operator.
 */
export function errMsg(err: any, fallback = 'Something went wrong'): string {
  return err?.response?.data?.message || err?.message || fallback;
}

/**
 * Today's date as YYYY-MM-DD — default for date-picker inputs.
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Shared save handler: POST → toast → close modal → reload list.
 */
export async function savePost({
  path,
  body,
  setSaving,
  onDone,
  successMsg,
}: {
  path: string;
  body: any;
  setSaving: (v: boolean) => void;
  onDone: () => void;
  successMsg: string;
}) {
  setSaving(true);
  try {
    await api.post(path, body);
    toast.success(successMsg);
    onDone();
  } catch (err) {
    toast.error(errMsg(err));
  } finally {
    setSaving(false);
  }
}

/**
 * Shared PATCH handler.
 */
export async function savePatch({
  path,
  body,
  setSaving,
  onDone,
  successMsg,
}: {
  path: string;
  body: any;
  setSaving: (v: boolean) => void;
  onDone: () => void;
  successMsg: string;
}) {
  setSaving(true);
  try {
    await api.patch(path, body);
    toast.success(successMsg);
    onDone();
  } catch (err) {
    toast.error(errMsg(err));
  } finally {
    setSaving(false);
  }
}
