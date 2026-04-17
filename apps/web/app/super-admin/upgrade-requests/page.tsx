'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Crown, TrendingUp, Shield, Zap, Check, X, RefreshCw, Loader2, ArrowRight,
  AlertCircle, Calendar, Building2, FileText,
} from 'lucide-react';

interface UpgradeRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  portalFamily?: string | null;
  subType?: string | null;
  fromTier: string;
  targetTier: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string | null;
  adminNote?: string | null;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

type TierKey = 'small' | 'medium' | 'large' | 'enterprise';

const TIER_COLORS: Record<TierKey, { bg: string; text: string; border: string; icon: any }> = {
  small:      { bg:'#E0F2FE', text:'#0369A1', border:'#BAE6FD', icon: Zap },
  medium:     { bg:'#D1FAE5', text:'#059669', border:'#A7F3D0', icon: TrendingUp },
  large:      { bg:'#EDE9FE', text:'#6D28D9', border:'#DDD6FE', icon: Shield },
  enterprise: { bg:'#FEF3C7', text:'#D97706', border:'#FDE68A', icon: Crown },
};

function TierBadge({ tier }: { tier: string }) {
  const config = TIER_COLORS[(tier as TierKey)] ?? TIER_COLORS.small;
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold capitalize"
      style={{ background: config.bg, color: config.text, border: `1px solid ${config.border}` }}
    >
      <Icon className="w-3 h-3" />
      {tier}
    </span>
  );
}

function ReviewModal({
  request, onClose, onDone,
}: {
  request: UpgradeRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!decision) { toast.error('Choose approve or reject'); return; }
    setSaving(true);
    try {
      await api.patch(`/super-admin/upgrade-requests/${request.tenantId}/${request.id}`, {
        status: decision, note: note.trim() || undefined,
      });
      toast.success(
        decision === 'approved'
          ? `Approved — ${request.tenantName} is now on ${request.targetTier}.`
          : `Request rejected for ${request.tenantName}.`
      );
      onDone();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not submit review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.65)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Review upgrade request</h3>
            <p className="text-xs text-slate-500 mt-0.5">{request.tenantName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Currently</p>
                <TierBadge tier={request.fromTier} />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 mx-3" />
              <div className="text-center flex-1">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Requesting</p>
                <TierBadge tier={request.targetTier} />
              </div>
            </div>
          </div>

          {request.note && (
            <div>
              <p className="text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Tenant's note</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                {request.note}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Decision</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDecision('approved')}
                className="px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  borderColor: decision === 'approved' ? '#059669' : '#E2E8F0',
                  background: decision === 'approved' ? '#D1FAE5' : 'white',
                  color: decision === 'approved' ? '#065F46' : '#475569',
                }}
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => setDecision('rejected')}
                className="px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  borderColor: decision === 'rejected' ? '#DC2626' : '#E2E8F0',
                  background: decision === 'rejected' ? '#FEE2E2' : 'white',
                  color: decision === 'rejected' ? '#991B1B' : '#475569',
                }}
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
              Admin note <span className="text-slate-400 font-normal">(optional)</span>
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={decision === 'approved'
                ? 'Pricing confirmed, activated. Migration scheduled for...'
                : decision === 'rejected'
                  ? 'Reason for rejection (visible internally only)...'
                  : 'Optional admin note...'}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none resize-none"
            />
          </div>

          {decision === 'approved' && (
            <div className="flex gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-900">
                Approving will immediately update <strong>{request.tenantName}</strong>'s plan to
                <strong> {request.targetTier}</strong>. New features unlock on their next API call.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!decision || saving}
            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-40 flex items-center gap-2"
            style={{
              background: decision === 'approved' ? '#059669' : decision === 'rejected' ? '#DC2626' : '#94A3B8',
            }}
          >
            {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>) : 'Submit decision'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UpgradeRequestsPage() {
  const [items, setItems] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [reviewing, setReviewing] = useState<UpgradeRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/upgrade-requests', {
        params: { status: statusFilter },
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Could not load upgrade requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const counts = {
    all:      items.length,
    pending:  items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upgrade Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review and action tier upgrade requests from tenants
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-4 py-2.5 text-sm font-semibold capitalize transition-all -mb-px border-b-2"
            style={{
              borderColor: statusFilter === s ? '#0D7C66' : 'transparent',
              color: statusFilter === s ? '#0D7C66' : '#64748B',
            }}
          >
            {s} {statusFilter === s && counts[s] > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-md bg-slate-100">{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-20" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No {statusFilter !== 'all' && statusFilter} requests</p>
          <p className="text-xs text-slate-500 mt-1">
            {statusFilter === 'pending' ? 'All upgrade requests have been actioned.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Tenant</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Upgrade</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Requested</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{r.tenantName}</p>
                          <p className="text-xs text-slate-500">
                            {r.portalFamily}{r.subType ? ` · ${r.subType}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <TierBadge tier={r.fromTier} />
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <TierBadge tier={r.targetTier} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(r.requestedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-block px-2 py-1 rounded-md text-xs font-bold capitalize"
                        style={{
                          background: r.status === 'approved' ? '#D1FAE5' : r.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                          color: r.status === 'approved' ? '#065F46' : r.status === 'rejected' ? '#991B1B' : '#92400E',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {r.status === 'pending' ? (
                        <button
                          onClick={() => setReviewing(r)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0D7C66] text-white hover:bg-[#0A5E4F] transition-colors"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {r.reviewedAt && new Date(r.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reviewing && (
        <ReviewModal
          request={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => { setReviewing(null); load(); }}
        />
      )}
    </div>
  );
}
