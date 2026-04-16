'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FlaskConical, Phone, Calendar, User, Home,
  Plus, ChevronRight, CheckCircle2, AlertTriangle, Activity,
  Heart, MessageSquare, Clock, Edit3, Loader2, Save,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

const STATUS_COLORS: Record<string, string> = {
  ORDERED: '#94A3B8', SAMPLE_COLLECTED: '#3B82F6', DISPATCHED: '#8B5CF6',
  RECEIVED_AT_LAB: '#06B6D4', IN_PROGRESS: '#F59E0B', RESULTED: '#F97316',
  VALIDATED: '#22C55E', DELIVERED: '#10B981', CANCELLED: '#EF4444', REJECTED: '#DC2626',
};

function EditPatientModal({ patient, onClose, onSaved }: { patient: any; onClose: () => void; onSaved: (p: any) => void }) {
  const [form, setForm] = useState({
    firstName: patient.firstName ?? '',
    lastName: patient.lastName ?? '',
    phone: patient.phone ?? '',
    gender: patient.gender ?? '',
    dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
    email: patient.email ?? '',
    bloodGroup: patient.bloodGroup ?? '',
    address: patient.address ?? '',
  });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/patients/${patient.id}`, form);
      toast.success('Patient updated');
      onSaved(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Edit Patient</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">✕</button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div><label className={labelCls}>First Name</label><input className={inputCls} value={form.firstName} onChange={setF('firstName')} /></div>
          <div><label className={labelCls}>Last Name</label><input className={inputCls} value={form.lastName} onChange={setF('lastName')} /></div>
          <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.phone} onChange={setF('phone')} /></div>
          <div><label className={labelCls}>Gender</label>
            <select className={inputCls} value={form.gender} onChange={setF('gender')}>
              <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div><label className={labelCls}>Date of Birth</label><input className={inputCls} type="date" value={form.dateOfBirth} onChange={setF('dateOfBirth')} /></div>
          <div><label className={labelCls}>Blood Group</label>
            <select className={inputCls} value={form.bloodGroup} onChange={setF('bloodGroup')}>
              <option value="">Unknown</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Email</label><input className={inputCls} type="email" value={form.email} onChange={setF('email')} /></div>
          <div className="col-span-2"><label className={labelCls}>Address</label><input className={inputCls} value={form.address} onChange={setF('address')} /></div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'info'>('orders');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get('/diagnostic/orders', { params: { search: patientId, limit: 50 } })
          .catch(() => api.get('/lab/orders', { params: { limit: 50 } })),
      ]);
      setPatient(pRes.data);
      // Filter orders for this patient
      const allOrders = oRes.data.data ?? [];
      setOrders(allOrders.filter((o: any) => o.patientId === patientId || o.patient?.id === patientId));
    } catch { toast.error('Failed to load patient'); }
    finally { setLoading(false); }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="space-y-5">
      <div className="animate-pulse bg-slate-200 rounded-2xl h-32" />
      <div className="animate-pulse bg-slate-200 rounded-2xl h-64" />
    </div>
  );
  if (!patient) return (
    <div className="text-center py-20 text-slate-400">
      <User className="w-12 h-12 mx-auto mb-3 text-slate-200" />
      <p className="font-semibold text-slate-500">Patient not found</p>
    </div>
  );

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 86_400_000))
    : null;
  const name = `${patient.firstName} ${patient.lastName ?? ''}`.trim();
  const totalSpend = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const lastOrder = orders[0];
  const criticalOrders = orders.filter(o =>
    (o.criticalAlerts ?? []).some((a: any) => !a.acknowledgedAt)
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{name}</h1>
          <p className="text-sm text-slate-500">
            {patient.gender}{age ? ` · ${age} years` : ''}
            {patient.bloodGroup ? ` · ${patient.bloodGroup}` : ''}
            {patient.healthId ? ` · ${patient.healthId}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`https://wa.me/91${patient.phone?.slice(-10)}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90"
            style={{ background: '#25D366' }}>
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </a>
          <Link href={`/diagnostic/lab-orders/new?patientId=${patientId}`}>
            <button className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90"
              style={{ background: NAVY }}>
              <Plus className="w-4 h-4" /> New Order
            </button>
          </Link>
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      {/* Critical alert banner */}
      {criticalOrders > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5">
          <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse flex-shrink-0" />
          <p className="text-sm font-bold text-red-800">
            {criticalOrders} unacknowledged critical value alert{criticalOrders > 1 ? 's' : ''} — requires immediate clinical attention
          </p>
        </div>
      )}

      {/* Patient summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Phone', value: patient.phone, icon: Phone, color: NAVY },
          { label: 'Total Orders', value: orders.length, icon: FlaskConical, color: '#8B5CF6' },
          { label: 'Total Spend', value: formatINR(totalSpend), icon: Activity, color: TEAL },
          { label: 'Last Visit', value: lastOrder ? formatDate(lastOrder.createdAt) : 'Never', icon: Calendar, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}14` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1.5 w-fit">
        {[
          { key: 'orders', label: `Lab Orders (${orders.length})` },
          { key: 'info', label: 'Patient Info' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
              activeTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
              <FlaskConical className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-slate-500">No orders yet</p>
              <Link href={`/diagnostic/lab-orders/new?patientId=${patientId}`}>
                <button className="mt-4 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 mx-auto flex items-center gap-2"
                  style={{ background: NAVY }}>
                  <Plus className="w-4 h-4" /> Create First Order
                </button>
              </Link>
            </div>
          ) : (
            orders.map(o => {
              const items = o.orderItems ?? o.tests ?? [];
              const statusColor = STATUS_COLORS[o.status] ?? '#94A3B8';
              return (
                <Link key={o.id} href={`/diagnostic/lab-orders/${o.id}`}>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#1E3A5F] font-mono text-sm">{o.orderNumber}</p>
                          {o.isStat && <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">STAT</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: `${statusColor}15`, color: statusColor }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                          {o.status?.replace(/_/g, ' ')}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {items.slice(0, 5).map((t: any, i: number) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {t.testCode ?? t.code ?? t.testName ?? String(t)}
                        </span>
                      ))}
                      {items.length > 5 && (
                        <span className="text-[10px] text-slate-400">+{items.length - 5} more</span>
                      )}
                      {o.totalAmount > 0 && (
                        <span className="ml-auto text-xs font-bold text-slate-700">{formatINR(o.totalAmount)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Info tab */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="grid grid-cols-2 gap-6">
            {[
              ['Full Name', name],
              ['Phone', patient.phone],
              ['Email', patient.email || '—'],
              ['Gender', patient.gender || '—'],
              ['Date of Birth', patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—'],
              ['Age', age ? `${age} years` : '—'],
              ['Blood Group', patient.bloodGroup || 'Unknown'],
              ['Health ID', patient.healthId || '—'],
            ].map(([k, v]) => (
              <div key={k as string}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{k}</p>
                <p className="text-sm font-semibold text-slate-900">{v}</p>
              </div>
            ))}
            {patient.address && (
              <div className="col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Address</p>
                <p className="text-sm font-semibold text-slate-900">{patient.address}</p>
              </div>
            )}
            {(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
              <>
                {patient.allergies?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">⚠ Allergies</p>
                    <p className="text-sm font-semibold text-red-800">{patient.allergies.join(', ')}</p>
                  </div>
                )}
                {patient.chronicConditions?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1">Chronic Conditions</p>
                    <p className="text-sm font-semibold text-amber-900">{patient.chronicConditions.join(', ')}</p>
                  </div>
                )}
              </>
            )}
            <div className="col-span-2 pt-4 border-t border-slate-50">
              <p className="text-xs text-slate-400">
                Patient registered: {formatDate(patient.createdAt)} · 
                Last updated: {formatDate(patient.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <EditPatientModal
          patient={patient}
          onClose={() => setEditing(false)}
          onSaved={updated => {
            setPatient(updated);
            toast.success('Patient updated');
          }}
        />
      )}
    </div>
  );
}
