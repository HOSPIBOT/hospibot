'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FlaskConical, Clock, CheckCircle2, Send,
  Upload, Loader2, User, Phone, AlertTriangle,
} from 'lucide-react';

const PIPELINE = [
  { status: 'ORDERED',          label: 'Order Placed',      color: '#64748B' },
  { status: 'SAMPLE_COLLECTED', label: 'Sample Collected',  color: '#3B82F6' },
  { status: 'PROCESSING',       label: 'Processing',        color: '#8B5CF6' },
  { status: 'COMPLETED',        label: 'Results Ready',     color: '#F59E0B' },
  { status: 'DELIVERED',        label: 'Report Delivered',  color: '#10B981' },
];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] outline-none transition-all placeholder:text-slate-400';

export default function LabOrderDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [order, setOrder]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [reportUrl, setReportUrl] = useState('');
  const [remarks, setRemarks]     = useState('');

  useEffect(() => {
    api.get(`/lab/orders/${id}`)
      .then(r => { setOrder(r.data); setReportUrl(r.data.reportUrl || ''); setRemarks(r.data.remarks || ''); })
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setSaving(true);
    try {
      await api.patch(`/lab/orders/${id}/status`, { status: newStatus });
      setOrder((o: any) => ({ ...o, status: newStatus }));
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const saveReport = async () => {
    if (!reportUrl) { toast.error('Enter report URL'); return; }
    setSaving(true);
    try {
      await api.patch(`/lab/orders/${id}`, { reportUrl, remarks });
      await api.post(`/lab/orders/${id}/status`, { status: 'COMPLETED' }).catch(() => {});
      toast.success('Report saved and sent to patient via WhatsApp!');
      setOrder((o: any) => ({ ...o, reportUrl, reportDelivered: true }));
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const sendReport = async () => {
    setSaving(true);
    try {
      await api.post(`/lab/orders/${id}/deliver`);
      toast.success('Report sent to patient via WhatsApp!');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to send'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#1E3A5F] animate-spin" /></div>;
  if (!order)  return <div className="text-center py-20 text-slate-400">Order not found</div>;

  const currentIdx  = PIPELINE.findIndex(s => s.status === order.status);
  const tests       = (order.tests as any[]) || [];
  const patient     = order.patient;
  const patName     = patient ? `${patient.firstName} ${patient.lastName || ''}`.trim() : '—';
  const canAdvance  = currentIdx >= 0 && currentIdx < PIPELINE.length - 1;
  const nextStep    = canAdvance ? PIPELINE[currentIdx + 1] : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">{formatDate(order.createdAt)} · {tests.length} test{tests.length !== 1 ? 's' : ''}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
          order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
          order.status === 'COMPLETED' ? 'bg-amber-100 text-amber-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {order.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Status pipeline */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-2">
          {PIPELINE.map((step, i) => {
            const done    = i <= currentIdx;
            const current = i === currentIdx;
            return (
              <div key={step.status} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                }`} style={done ? { background: step.color } : {}}>
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                <p className={`text-[10px] font-semibold text-center leading-tight ${current ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                {i < PIPELINE.length - 1 && (
                  <div className={`h-0.5 w-full absolute top-4 left-1/2 ${i < currentIdx ? 'bg-[#10B981]' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Advance button */}
        {canAdvance && nextStep && (
          <div className="mt-5 flex justify-center">
            <button onClick={() => updateStatus(nextStep.status)} disabled={saving}
              className="flex items-center gap-2 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
              style={{ background: nextStep.color }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark as: {nextStep.label}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Patient info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-[#1E3A5F]" /> Patient</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Name</span><span className="font-semibold text-slate-900">{patName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Phone</span><span className="text-slate-700">{patient?.phone}</span></div>
            {patient?.healthId && <div className="flex justify-between text-sm"><span className="text-slate-500">Health ID</span><span className="font-mono text-slate-600 text-xs">{patient.healthId}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-slate-500">Priority</span><span className={`font-bold text-xs px-2 py-0.5 rounded-full ${order.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{order.priority || 'ROUTINE'}</span></div>
          </div>
          <a href={`/clinical/patients/${order.patientId}`} className="block text-center text-xs font-semibold text-[#1E3A5F] hover:underline mt-2">
            View Patient 360 →
          </a>
        </div>

        {/* Tests ordered */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FlaskConical className="w-4 h-4 text-[#1E3A5F]" /> Tests Ordered</h3>
          <div className="space-y-2">
            {tests.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <p className="text-sm font-medium text-slate-900">{t.testName || t.name || t}</p>
                {t.code && <span className="text-[10px] font-mono text-slate-400">{t.code}</span>}
              </div>
            ))}
          </div>
          {order.totalAmount && (
            <p className="text-xs font-bold text-[#1E3A5F] pt-1">Total: ₹{(order.totalAmount / 100).toLocaleString('en-IN')}</p>
          )}
        </div>
      </div>

      {/* Report upload section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Upload className="w-4 h-4 text-[#1E3A5F]" /> Report</h3>

        {order.reportDelivered ? (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-semibold">Report delivered to patient via WhatsApp</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Report URL / File Link</label>
              <input className={inputCls} placeholder="https://drive.google.com/file/... or any direct URL"
                value={reportUrl} onChange={e => setReportUrl(e.target.value)} />
              <p className="text-[10px] text-slate-400 mt-1">Upload to Google Drive, Dropbox, or any cloud storage and paste the link here</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Lab Remarks (optional)</label>
              <textarea className={`${inputCls} resize-none`} rows={2}
                placeholder="Normal values, interpretation, follow-up recommendation…"
                value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={saveReport} disabled={saving || !reportUrl}
                className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: '#1E3A5F' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Save & Deliver Report
              </button>
              {order.reportUrl && (
                <button onClick={sendReport} disabled={saving}
                  className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60">
                  <Send className="w-4 h-4" /> Resend
                </button>
              )}
            </div>
          </div>
        )}

        {order.reportUrl && (
          <a href={order.reportUrl} target="_blank" rel="noreferrer"
            className="block text-xs text-[#1E3A5F] underline hover:opacity-70 transition-opacity">
            View uploaded report →
          </a>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Order Notes</p>
          <p className="text-sm text-amber-800">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
