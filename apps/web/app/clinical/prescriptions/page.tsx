'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Pill, Plus, RefreshCw, Search, X, Send, Loader2,
  ChevronLeft, ChevronRight, MessageSquare, CheckCircle2,
  AlertTriangle, Clock, Eye,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

interface Medication {
  name: string; genericName: string; dosage: string; frequency: string;
  duration: string; route: string; instructions: string; refillable: boolean;
}

function MedicineRow({ med, index, meta, onChange, onRemove }: {
  med: Medication; index: number; meta: any;
  onChange: (m: Medication) => void; onRemove: () => void;
}) {
  const [drugSearch, setDrugSearch] = useState(med.name || '');
  const [showDrugList, setShowDrugList] = useState(false);

  const filteredDrugs = drugSearch.length > 1
    ? (meta?.drugs || []).filter((d: string) => d.toLowerCase().includes(drugSearch.toLowerCase()))
    : [];

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medicine {index + 1}</span>
        <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Drug name with autocomplete */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Drug Name *</label>
          <input className={inputCls} placeholder="Search drug…"
            value={drugSearch}
            onChange={e => { setDrugSearch(e.target.value); setShowDrugList(true); onChange({ ...med, name: e.target.value }); }}
            onFocus={() => setShowDrugList(true)} />
          {showDrugList && filteredDrugs.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
              {filteredDrugs.slice(0, 8).map((d: string) => (
                <button key={d} onClick={() => { onChange({ ...med, name: d }); setDrugSearch(d); setShowDrugList(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 text-slate-800">
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dosage */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Dosage / Strength</label>
          <input className={inputCls} placeholder="e.g. 500mg, 10ml" value={med.dosage}
            onChange={e => onChange({ ...med, dosage: e.target.value })} />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Frequency *</label>
          <select className={inputCls} value={med.frequency} onChange={e => onChange({ ...med, frequency: e.target.value })}>
            <option value="">Select…</option>
            {(meta?.frequencies || []).map((f: string) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Duration *</label>
          <select className={inputCls} value={med.duration} onChange={e => onChange({ ...med, duration: e.target.value })}>
            <option value="">Select…</option>
            {(meta?.durations || []).map((d: string) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Route */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Route</label>
          <select className={inputCls} value={med.route} onChange={e => onChange({ ...med, route: e.target.value })}>
            <option value="">Oral (default)</option>
            {(meta?.routes || []).map((r: string) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Special Instructions</label>
          <input className={inputCls} placeholder="e.g. Take with food" value={med.instructions}
            onChange={e => onChange({ ...med, instructions: e.target.value })} />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={med.refillable} onChange={e => onChange({ ...med, refillable: e.target.checked })}
          className="w-4 h-4 accent-[#0D7C66]" />
        <span className="text-xs text-slate-600">Set refill reminder (30 days)</span>
      </label>
    </div>
  );
}

function WritePrescriptionModal({ patientId, patientName, doctorId, onClose, onCreated }: {
  patientId: string; patientName: string; doctorId?: string; onClose: () => void; onCreated: () => void;
}) {
  const [meta, setMeta]         = useState<any>(null);
  const [doctors, setDoctors]   = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    doctorId: doctorId || '',
    diagnosis: '', complaints: '', notes: '', followUpDays: '',
    medications: [{ name: '', genericName: '', dosage: '', frequency: '', duration: '', route: 'Oral', instructions: '', refillable: false }] as Medication[],
  });

  useEffect(() => {
    Promise.all([
      api.get('/prescriptions/metadata'),
      api.get('/doctors?limit=50'),
    ]).then(([m, d]) => {
      setMeta(m.data);
      setDoctors(d.data.data || []);
    }).catch(() => {});
  }, []);

  const updateMed = (index: number, med: Medication) => {
    setForm(f => ({ ...f, medications: f.medications.map((m, i) => i === index ? med : m) }));
  };

  const removeMed = (index: number) => {
    setForm(f => ({ ...f, medications: f.medications.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!form.doctorId) { toast.error('Select a doctor'); return; }
    const validMeds = form.medications.filter(m => m.name && m.frequency && m.duration);
    if (validMeds.length === 0) { toast.error('Add at least one medication with name, frequency, and duration'); return; }

    setSubmitting(true);
    try {
      await api.post('/prescriptions', {
        patientId, doctorId: form.doctorId,
        medications: validMeds, diagnosis: form.diagnosis,
        complaints: form.complaints, notes: form.notes,
        followUpDays: form.followUpDays ? Number(form.followUpDays) : undefined,
      });
      toast.success('Prescription saved! Patient will receive it via WhatsApp.');
      onCreated(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save prescription');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Write Prescription</h2>
            <p className="text-xs text-slate-400 mt-0.5">Patient: {patientName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Doctor + Clinical */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Prescribing Doctor *</label>
              <select className={inputCls} value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
                <option value="">Select doctor…</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName || ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Follow-Up (days)</label>
              <input type="number" min={1} className={inputCls} placeholder="e.g. 7, 14, 30"
                value={form.followUpDays} onChange={e => setForm(f => ({ ...f, followUpDays: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Chief Complaints</label>
              <input className={inputCls} placeholder="Fever, cough, headache…"
                value={form.complaints} onChange={e => setForm(f => ({ ...f, complaints: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Diagnosis / Impression</label>
              <input className={inputCls} placeholder="URTI, Type 2 DM, Hypertension…"
                value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medications ({form.medications.length})</p>
              <button onClick={() => setForm(f => ({ ...f, medications: [...f.medications, { name: '', genericName: '', dosage: '', frequency: '', duration: '', route: 'Oral', instructions: '', refillable: false }] }))}
                className="flex items-center gap-1 text-xs font-semibold text-[#0D7C66] hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Medication
              </button>
            </div>
            {form.medications.map((med, i) => (
              <MedicineRow key={i} med={med} index={i} meta={meta}
                onChange={m => updateMed(i, m)}
                onRemove={() => removeMed(i)} />
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Doctor's Notes / Advice</label>
            <textarea className={`${inputCls} resize-none`} rows={2}
              placeholder="Drink plenty of fluids, rest, avoid oily food…"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-xl px-4 py-3 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-[#0D7C66] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#0A5E4F]">
              Prescription will be saved and automatically sent to the patient's WhatsApp with the full medication list and doctor's instructions.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Pill className="w-4 h-4" />
            {submitting ? 'Saving…' : 'Save & Send Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PrescriptionCard({ rx, onSend }: { rx: any; onSend: (id: string) => void }) {
  const meds = rx.medications as any[];
  const doctorName = `Dr. ${rx.doctor?.user?.firstName} ${rx.doctor?.user?.lastName || ''}`.trim();
  const patientName = `${rx.patient?.firstName} ${rx.patient?.lastName || ''}`.trim();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-slate-900">{patientName}</p>
          <p className="text-xs text-slate-400 mt-0.5">{doctorName} · {formatDate(rx.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {rx.isActive ? (
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">Active</span>
          ) : (
            <span className="text-[11px] font-bold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">Inactive</span>
          )}
          {rx.refillDueDate && new Date(rx.refillDueDate) > new Date() && (
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Refill due {formatDate(rx.refillDueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Medication chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {meds.slice(0, 4).map((m: any, i: number) => (
          <span key={i} className="text-[11px] font-medium bg-[#E8F5F0] text-[#0D7C66] px-2.5 py-1 rounded-full">
            {m.name} {m.dosage && `• ${m.dosage}`} {m.frequency && `• ${m.frequency}`}
          </span>
        ))}
        {meds.length > 4 && <span className="text-[11px] text-slate-400">+{meds.length - 4} more</span>}
      </div>

      {rx.notes && <p className="text-xs text-slate-500 mb-3 italic">"{rx.notes}"</p>}

      <div className="flex items-center gap-2">
        <a href={`/clinical/prescriptions/${rx.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <Eye className="w-3.5 h-3.5" /> View
        </a>
        <button onClick={() => onSend(rx.id)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#25D366] py-2 rounded-xl hover:opacity-90 transition-opacity">
          <MessageSquare className="w-3.5 h-3.5" /> Send via WhatsApp
        </button>
      </div>
    </div>
  );
}


function StandaloneWriteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [patSearch, setPatSearch] = useState('');
  const [patients, setPatients]   = useState<any[]>([]);
  const [selected, setSelected]   = useState<any>(null);

  useEffect(() => {
    if (patSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() =>
      api.get('/patients', { params: { search: patSearch, limit: 6 } })
        .then(r => setPatients(r.data.data || [])).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  if (!selected) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Select Patient</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
          </div>
          <div className="relative">
            <input className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400"
              placeholder="Search by name or phone…"
              value={patSearch} onChange={e => setPatSearch(e.target.value)} autoFocus />
            {patients.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {patients.map(p => (
                  <button key={p.id} onClick={() => setSelected(p)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                    <p className="text-sm font-semibold text-slate-900">{p.firstName} {p.lastName || ''}</p>
                    <p className="text-xs text-slate-400">{p.phone} · {p.healthId}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {patSearch.length > 1 && patients.length === 0 && (
            <p className="text-xs text-slate-400 mt-3 text-center">No patients found. <a href="/clinical/patients" className="text-[#0D7C66] underline">Register new patient</a></p>
          )}
        </div>
      </div>
    );
  }

  return (
    <WritePrescriptionModal
      patientId={selected.id}
      patientName={`${selected.firstName} ${selected.lastName || ''}`.trim()}
      doctorId=""
      onClose={onClose}
      onCreated={onCreated} />
  );
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [meta, setMeta]   = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [showWrite, setShowWrite] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (debSearch) params.search = debSearch;
      const res = await api.get('/prescriptions', { params });
      setPrescriptions(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load prescriptions'); }
    finally { setLoading(false); }
  }, [debSearch]);

  useEffect(() => { load(1); }, [load]);

  const sendRx = async (id: string) => {
    setSending(id);
    try {
      await api.post(`/prescriptions/${id}/send`);
      toast.success('Prescription sent via WhatsApp!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send');
    } finally { setSending(null); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total.toLocaleString('en-IN')} total prescriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowWrite(true)}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0A5E4F] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Write Prescription
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search by patient name or phone…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>}
        </div>
      </div>

      {/* Prescriptions grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-44" />)}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Pill className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No prescriptions yet</p>
          <p className="text-slate-300 text-sm mt-1 mb-5">Write your first digital prescription</p>
          <button onClick={() => setShowWrite(true)}
            className="bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] transition-colors mx-auto flex items-center gap-2">
            <Plus className="w-4 h-4" /> Write First Prescription
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {prescriptions.map(rx => (
              <PrescriptionCard key={rx.id} rx={rx} onSend={sendRx} />
            ))}
          </div>
          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-slate-500">Showing {(meta.page-1)*meta.limit+1}–{Math.min(meta.page*meta.limit, meta.total)} of {meta.total}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
                <span className="text-xs text-slate-600 px-3">{meta.page} / {meta.totalPages}</span>
                <button onClick={() => load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>
          )}
        </>
      )}

      {showWrite && (
        <StandaloneWriteModal
          onClose={() => setShowWrite(false)}
          onCreated={() => load(1)} />
      )}
    </div>
  );
}
