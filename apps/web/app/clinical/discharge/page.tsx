'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import { DictationTextarea } from '@/components/ui/DictationButton';
import toast from 'react-hot-toast';
import {
  FileText, Send, Printer, ArrowLeft, Loader2, MessageSquare,
  CheckCircle2, Pill, FlaskConical, Calendar, User, AlertTriangle,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

export default function DischargeSummaryPage() {
  const router         = useRouter();
  const params         = useSearchParams();
  const patientId      = params?.get('patientId');
  const appointmentId  = params?.get('appointmentId');

  const [patient,  setPatient]  = useState<any>(null);
  const [visit,    setVisit]    = useState<any>(null);
  const [bed,      setBed]      = useState<any>(null);
  const [tenant,   setTenant]   = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [sent,     setSent]     = useState(false);

  // Summary form
  const [form, setForm] = useState({
    admissionDate:       '',
    dischargeDate:       new Date().toISOString().slice(0, 10),
    admittingDiagnosis:  '',
    dischargeDiagnosis:  '',
    proceduresDone:      '',
    conditionAtDischarge:'Stable',
    medicationsOnDischarge: '',
    followUpInstructions: '',
    followUpDate:        '',
    dietaryInstructions: '',
    activityRestrictions:'',
    specialInstructions: '',
  });

  const set = (k: string) => (val: string) => setForm(f => ({ ...f, [k]: val }));
  const setE = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    Promise.all([
      patientId  ? api.get(`/patients/${patientId}`)            : Promise.resolve(null),
      appointmentId ? api.get(`/appointments/${appointmentId}`) : Promise.resolve(null),
      api.get('/tenants/current').catch(() => ({ data: {} })),
    ]).then(([pRes, aRes, tRes]) => {
      if (pRes?.data) {
        setPatient(pRes.data);
        // Pre-fill from last visit if available
        const lastVisit = pRes.data.visits?.[0];
        if (lastVisit) {
          setVisit(lastVisit);
          setForm(f => ({
            ...f,
            admittingDiagnosis: lastVisit.diagnosisText || '',
            dischargeDiagnosis: lastVisit.diagnosisText || '',
          }));
        }
      }
      if (aRes?.data) {
        setVisit(aRes.data);
        setForm(f => ({
          ...f,
          admissionDate: aRes.data.scheduledAt?.slice(0, 10) || '',
          admittingDiagnosis: aRes.data.visit?.diagnosisText || '',
          dischargeDiagnosis: aRes.data.visit?.diagnosisText || '',
        }));
      }
      setTenant(tRes?.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [patientId, appointmentId]);

  const patName   = patient ? `${patient.firstName} ${patient.lastName || ''}`.trim() : '—';
  const ageYears  = patient?.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const sendViaWhatsApp = async () => {
    if (!patient?.phone) { toast.error('No phone number on file'); return; }
    setSaving(true);
    try {
      const message = buildSummaryText();
      await api.post('/whatsapp/send', {
        to: patient.phone,
        message,
      });
      setSent(true);
      toast.success('Discharge summary sent via WhatsApp!');
    } catch { toast.error('Failed to send'); }
    finally { setSaving(false); }
  };

  const buildSummaryText = () =>
    `*DISCHARGE SUMMARY*
*${tenant?.name || 'Hospital'}*

*Patient:* ${patName}${ageYears ? ` (${ageYears} yrs)` : ''}
*Health ID:* ${patient?.healthId || '—'}
*Phone:* ${patient?.phone || '—'}

*Admission Date:* ${form.admissionDate || '—'}
*Discharge Date:* ${form.dischargeDate}

*Admitting Diagnosis:* ${form.admittingDiagnosis || '—'}
*Discharge Diagnosis:* ${form.dischargeDiagnosis || '—'}
${form.proceduresDone ? `*Procedures Done:* ${form.proceduresDone}\n` : ''}
*Condition at Discharge:* ${form.conditionAtDischarge}

*Medications on Discharge:*
${form.medicationsOnDischarge || '—'}

*Follow-Up Instructions:*
${form.followUpInstructions || '—'}
${form.followUpDate ? `*Follow-Up Date:* ${form.followUpDate}\n` : ''}
${form.dietaryInstructions ? `*Diet:* ${form.dietaryInstructions}\n` : ''}
${form.activityRestrictions ? `*Activity:* ${form.activityRestrictions}\n` : ''}
${form.specialInstructions ? `*Special Instructions:* ${form.specialInstructions}\n` : ''}
For queries, contact ${tenant?.phone || 'our helpline'}.`;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-[#0D7C66] animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#0D7C66]" /> Discharge Summary
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{patName}{ageYears ? ` · ${ageYears} yrs` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={sendViaWhatsApp} disabled={saving || !patient?.phone}
            className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            {sent ? 'Sent!' : 'Send via WhatsApp'}
          </button>
        </div>
      </div>

      {/* Patient info card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 grid grid-cols-4 gap-4">
        {[
          { label: 'Patient Name', value: patName },
          { label: 'Age / Gender', value: `${ageYears ? ageYears + ' yrs' : '—'} · ${patient?.gender || '—'}` },
          { label: 'Blood Group', value: patient?.bloodGroup || '—' },
          { label: 'Health ID', value: patient?.healthId || '—' },
          { label: 'Phone', value: patient?.phone || '—' },
          { label: 'Allergies', value: patient?.allergies?.join(', ') || 'None known' },
          { label: 'Chronic Conditions', value: patient?.chronicConditions?.join(', ') || 'None' },
          { label: 'Insurance', value: patient?.insuranceProvider || '—' },
        ].map(f => (
          <div key={f.label}>
            <p className="text-xs text-slate-400 font-medium">{f.label}</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Summary Form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">Clinical Summary</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Admission Date</label>
            <input type="date" className={inputCls} value={form.admissionDate} onChange={setE('admissionDate')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Discharge Date</label>
            <input type="date" className={inputCls} value={form.dischargeDate} onChange={setE('dischargeDate')} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Admitting Diagnosis</label>
          <DictationTextarea value={form.admittingDiagnosis} onChange={set('admittingDiagnosis')} rows={2}
            placeholder="Primary diagnosis at time of admission…" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Discharge Diagnosis</label>
          <DictationTextarea value={form.dischargeDiagnosis} onChange={set('dischargeDiagnosis')} rows={2}
            placeholder="Final diagnosis at time of discharge…" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Procedures / Surgeries Performed</label>
          <DictationTextarea value={form.proceduresDone} onChange={set('proceduresDone')} rows={2}
            placeholder="List procedures, surgeries, interventions…" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Condition at Discharge</label>
          <select className={inputCls} value={form.conditionAtDischarge} onChange={setE('conditionAtDischarge')}>
            {['Stable', 'Improved', 'Unchanged', 'Deteriorated', 'Recovered', 'Critical', 'Expired'].map(c =>
              <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-[#0D7C66]" /> Medications on Discharge
          </label>
          <DictationTextarea value={form.medicationsOnDischarge} onChange={set('medicationsOnDischarge')} rows={4}
            placeholder="Tab Metformin 500mg — 1 tab twice daily × 30 days&#10;Tab Amlodipine 5mg — 1 tab once daily…" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">Discharge Instructions</h2>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Follow-Up Instructions</label>
          <DictationTextarea value={form.followUpInstructions} onChange={set('followUpInstructions')} rows={3}
            placeholder="Review stitches at 7 days. Blood test in 2 weeks. Consult cardiologist if chest pain…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Follow-Up Date</label>
            <input type="date" className={inputCls} value={form.followUpDate} onChange={setE('followUpDate')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Activity Restrictions</label>
            <input className={inputCls} placeholder="No strenuous activity for 4 weeks…" value={form.activityRestrictions} onChange={setE('activityRestrictions')} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Dietary Instructions</label>
          <input className={inputCls} placeholder="Low sodium diet, avoid spicy food…" value={form.dietaryInstructions} onChange={setE('dietaryInstructions')} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Special Instructions</label>
          <DictationTextarea value={form.specialInstructions} onChange={set('specialInstructions')} rows={2}
            placeholder="Call 911 or visit ER immediately if…" />
        </div>
      </div>

      {/* WhatsApp preview */}
      <div className="bg-[#1a1a2e] rounded-2xl p-5">
        <p className="text-[#25D366] text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Preview
        </p>
        <div className="bg-[#DCF8C6] rounded-2xl p-4 max-w-sm text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed">
          {buildSummaryText().slice(0, 400)}…
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-sm text-slate-500">
          {sent ? (
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Discharge summary sent to {patient?.phone}
            </span>
          ) : 'Ready to send discharge summary via WhatsApp'}
        </p>
        <div className="flex items-center gap-3">
          {form.followUpDate && (
            <a href={`/clinical/appointments?newAppt=1&patientId=${patientId}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#0D7C66] border border-[#0D7C66]/30 px-3 py-2 rounded-xl hover:bg-[#E8F5F0]">
              <Calendar className="w-4 h-4" /> Book Follow-Up
            </a>
          )}
          <button onClick={sendViaWhatsApp} disabled={saving || !patient?.phone}
            className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Discharge Summary
          </button>
        </div>
      </div>
    </div>
  );
}
