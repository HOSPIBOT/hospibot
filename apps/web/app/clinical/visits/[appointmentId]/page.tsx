'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Activity, Heart, Thermometer, Wind, Ruler, Weight,
  Stethoscope, Pill, CreditCard, CheckCircle2, ArrowLeft,
  Loader2, Plus, X, Save, Send, Clock, AlertTriangle, Mic,
} from 'lucide-react';
import { DictationTextarea } from '@/components/ui/DictationButton';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';
const sectionCls = 'bg-white rounded-2xl border border-slate-100 p-5 space-y-4';

const COMMON_DIAGNOSES = [
  'Upper Respiratory Tract Infection (URTI)', 'Lower Respiratory Tract Infection (LRTI)',
  'Acute Gastroenteritis', 'Hypertension', 'Type 2 Diabetes Mellitus',
  'Urinary Tract Infection (UTI)', 'Migraine', 'Tension Headache',
  'Acute Pharyngitis', 'Allergic Rhinitis', 'Bronchial Asthma', 'GERD / Acid Reflux',
  'Hypothyroidism', 'Anaemia', 'Dengue Fever', 'Malaria', 'Typhoid Fever',
  'Viral Fever', 'Lower Back Pain', 'Knee Osteoarthritis',
];

const DRUG_META = {
  drugs: ['Paracetamol','Ibuprofen','Amoxicillin','Azithromycin','Metformin','Atorvastatin','Amlodipine','Omeprazole','Cetirizine','Montelukast','Doxycycline','Ciprofloxacin','Cefixime','Losartan','Aspirin','Vitamin B12','Vitamin D3','Iron + Folic Acid','Ondansetron','Domperidone','Warfarin','Metoprolol','Lisinopril','Clopidogrel','Pantoprazole','Prednisolone','Insulin','Glipizide','Telmisartan','Ramipril'],
  frequencies: ['Once daily (OD)','Twice daily (BD)','Three times daily (TDS)','At bedtime (HS)','Before food (AC)','After food (PC)','As needed (SOS)'],
  durations: ['3 days','5 days','7 days','10 days','14 days','1 month','3 months','Ongoing'],
  // Known drug interactions [drugA, drugB, severity, message]
  interactions: [
    ['Aspirin',    'Warfarin',     'HIGH',   'Aspirin + Warfarin: High bleeding risk. Avoid unless under close monitoring.'],
    ['Clopidogrel','Omeprazole',   'MEDIUM', 'Clopidogrel + Omeprazole: Reduced antiplatelet effect. Consider Pantoprazole.'],
    ['Ibuprofen',  'Aspirin',      'MEDIUM', 'Ibuprofen + Aspirin: Ibuprofen reduces cardioprotective effect of Aspirin.'],
    ['Ibuprofen',  'Lisinopril',   'MEDIUM', 'NSAIDs may reduce effectiveness of ACE inhibitors and worsen kidney function.'],
    ['Ibuprofen',  'Warfarin',     'HIGH',   'NSAIDs + Warfarin: Significantly elevated bleeding risk. Avoid combination.'],
    ['Metformin',  'Ibuprofen',    'MEDIUM', 'NSAIDs may worsen kidney function and affect Metformin clearance.'],
    ['Doxycycline','Iron + Folic Acid','LOW', 'Iron reduces Doxycycline absorption. Take 2–3 hours apart.'],
    ['Ciprofloxacin','Iron + Folic Acid','LOW','Iron reduces Ciprofloxacin absorption. Take 2 hours apart.'],
    ['Atorvastatin','Azithromycin', 'MEDIUM','Azithromycin may increase Atorvastatin levels — watch for muscle pain.'],
    ['Warfarin',   'Azithromycin', 'HIGH',   'Azithromycin + Warfarin: May increase INR/bleeding risk. Monitor closely.'],
  ] as [string, string, string, string][],
  // Drug-allergy cross-references
  allergyMap: {
    'Penicillin':    ['Amoxicillin','Ampicillin','Co-amoxiclav'],
    'Sulfa':         ['Trimethoprim','Co-trimoxazole'],
    'NSAIDs':        ['Ibuprofen','Aspirin','Naproxen','Diclofenac'],
    'Aspirin':       ['Aspirin'],
    'Ibuprofen':     ['Ibuprofen'],
    'Amoxicillin':   ['Amoxicillin'],
    'Ciprofloxacin': ['Ciprofloxacin'],
    'Azithromycin':  ['Azithromycin'],
  } as Record<string, string[]>,
};

// Check drug interactions and allergy conflicts for a medication list
function checkDrugSafety(meds: {name:string}[], allergies: string[] = []): {level:'HIGH'|'MEDIUM'|'LOW'; msg:string}[] {
  const warnings: {level:'HIGH'|'MEDIUM'|'LOW'; msg:string}[] = [];
  const names = meds.map((m: any) => m.name.trim()).filter(Boolean);
  // Interaction check
  for (const [a, b, level, msg] of DRUG_META.interactions) {
    const hasA = names.some((n: any) => n.toLowerCase().includes(a.toLowerCase()));
    const hasB = names.some((n: any) => n.toLowerCase().includes(b.toLowerCase()));
    if (hasA && hasB) warnings.push({ level: level as any, msg });
  }
  // Allergy cross-check
  for (const allergy of allergies) {
    const conflictDrugs = DRUG_META.allergyMap[allergy] || [];
    for (const drug of conflictDrugs) {
      if (names.some((n: any) => n.toLowerCase().includes(drug.toLowerCase()))) {
        warnings.push({ level: 'HIGH', msg: `⚠️ ALLERGY ALERT: Patient is allergic to ${allergy}. ${drug} may cause allergic reaction.` });
      }
    }
  }
  return warnings;
}

interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions: string; }
interface Vitals { bp: string; pulse: string; temp: string; spo2: string; weight: string; height: string; rr: string; }

function VitalsPanel({ vitals, onChange }: { vitals: Vitals; onChange: (v: Vitals) => void }) {
  const fields = [
    { key: 'bp',     label: 'BP',         unit: 'mmHg',  icon: Heart,        placeholder: '120/80'  },
    { key: 'pulse',  label: 'Pulse',      unit: '/min',  icon: Activity,     placeholder: '72'      },
    { key: 'temp',   label: 'Temp',       unit: '°F',    icon: Thermometer,  placeholder: '98.6'    },
    { key: 'spo2',   label: 'SpO₂',       unit: '%',     icon: Wind,         placeholder: '98'      },
    { key: 'weight', label: 'Weight',     unit: 'kg',    icon: Weight,       placeholder: '65'      },
    { key: 'height', label: 'Height',     unit: 'cm',    icon: Ruler,        placeholder: '170'     },
    { key: 'rr',     label: 'RR',         unit: '/min',  icon: Wind,         placeholder: '16'      },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {fields.map((f: any) => (
        <div key={f.key} className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{f.label}</label>
          <div className="relative">
            <input className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
              placeholder={f.placeholder}
              value={(vitals as any)[f.key]}
              onChange={e => onChange({ ...vitals, [f.key]: e.target.value })} />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">
              {f.unit}
            </span>
          </div>
        </div>
      ))}
      {/* BMI computed */}
      {vitals.weight && vitals.height && (
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BMI</label>
          <div className="px-3 py-2 text-sm font-bold rounded-xl bg-[#E8F5F0] text-[#0D7C66]">
            {(Number(vitals.weight) / Math.pow(Number(vitals.height) / 100, 2)).toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
}

function MedRow({ med, index, onChange, onRemove }: {
  med: Medication; index: number; onChange: (m: Medication) => void; onRemove: () => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filtered = med.name.length > 1 ? DRUG_META.drugs.filter((d: any) => d.toLowerCase().includes(med.name.toLowerCase())) : [];

  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      {/* Drug name */}
      <div className="col-span-3 relative">
        {index === 0 && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Drug</label>}
        <input className={inputCls} placeholder="Drug name…"
          value={med.name}
          onChange={e => { onChange({ ...med, name: e.target.value }); setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-36 overflow-y-auto">
            {filtered.slice(0, 6).map((d: any) => (
              <button key={d} onMouseDown={() => { onChange({ ...med, name: d }); setShowSuggestions(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-50 last:border-0 text-slate-800">
                {d}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Dosage */}
      <div className="col-span-2">
        {index === 0 && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dosage</label>}
        <input className={inputCls} placeholder="500mg" value={med.dosage} onChange={e => onChange({ ...med, dosage: e.target.value })} />
      </div>
      {/* Frequency */}
      <div className="col-span-3">
        {index === 0 && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Frequency</label>}
        <select className={inputCls} value={med.frequency} onChange={e => onChange({ ...med, frequency: e.target.value })}>
          <option value="">Frequency…</option>
          {DRUG_META.frequencies.map((f: any) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      {/* Duration */}
      <div className="col-span-2">
        {index === 0 && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</label>}
        <select className={inputCls} value={med.duration} onChange={e => onChange({ ...med, duration: e.target.value })}>
          <option value="">Duration…</option>
          {DRUG_META.durations.map((d: any) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {/* Remove */}
      <div className={`col-span-1 flex justify-center ${index === 0 ? 'mt-5' : ''}`}>
        <button onClick={onRemove} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function VisitConsolePage() {
  const appointmentId = (useParams() as any)?.['appointmentId'] ?? '';
  const router = useRouter();

  const [appointment, setAppointment]   = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [completing, setCompleting]     = useState(false);
  const [activeSection, setActiveSection] = useState<'vitals'|'rx'|'billing'>('vitals');

  // Form state
  const [vitals, setVitals] = useState<Vitals>({ bp: '', pulse: '', temp: '', spo2: '', weight: '', height: '', rr: '' });
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosisText, setDiagnosisText]   = useState('');
  const [clinicalNotes, setClinicalNotes]   = useState('');
  const [treatmentPlan, setTreatmentPlan]   = useState('');
  const [followUpDays, setFollowUpDays]     = useState('');
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [billItems, setBillItems] = useState([
    { description: 'Consultation Fee', quantity: 1, unitPrice: 500, total: 500 },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      const apt = res.data;
      setAppointment(apt);

      // Pre-populate if visit exists
      if (apt.visit) {
        const v = apt.visit;
        setVitals(v.vitals || {});
        setChiefComplaint(v.chiefComplaint || '');
        setDiagnosisText(v.diagnosisText || '');
        setClinicalNotes(v.clinicalNotes || '');
        setTreatmentPlan(v.treatmentPlan || '');
        setFollowUpDays(v.followUpDays?.toString() || '');
      }
    } catch { toast.error('Failed to load appointment'); }
    finally { setLoading(false); }
  }, [appointmentId]);

  useEffect(() => { load(); }, [load]);

  const saveVisit = async () => {
    setSaving(true);
    try {
      await api.post('/visits', {
        appointmentId,
        patientId: appointment?.patientId,
        doctorId: appointment?.doctorId,
        vitals, chiefComplaint, diagnosisText, clinicalNotes, treatmentPlan,
        followUpDays: followUpDays ? Number(followUpDays) : undefined,
        visitType: 'OPD',
      });
      toast.success('Visit notes saved');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const savePrescription = async () => {
    const validMeds = medications.filter((m: any) => m.name && m.frequency && m.duration);
    if (validMeds.length === 0) { toast.error('Add at least one complete medication'); return; }
    setSaving(true);
    try {
      const rx = await api.post('/prescriptions', {
        patientId: appointment?.patientId,
        doctorId: appointment?.doctorId,
        medications: validMeds,
        diagnosis: diagnosisText,
        complaints: chiefComplaint,
        notes: clinicalNotes,
        followUpDays: followUpDays ? Number(followUpDays) : undefined,
      });
      // Auto-send via WhatsApp
      await api.post(`/prescriptions/${rx.data.id}/send`).catch(() => {});
      toast.success('Prescription saved and sent to patient via WhatsApp!');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const createInvoice = async () => {
    const total = billItems.reduce((s: number, i: any) => s + i.total, 0);
    setSaving(true);
    try {
      await api.post('/billing/invoices', {
        patientId: appointment?.patientId,
        appointmentId,
        items: billItems.map((i: any) => ({
          description: i.description, quantity: i.quantity,
          unitPrice: i.unitPrice * 100, totalPrice: i.total * 100,
        })),
        totalAmount: total * 100,
      });
      toast.success('Invoice created and sent to patient!');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const completeVisit = async () => {
    setCompleting(true);
    try {
      await saveVisit();
      await api.put(`/appointments/${appointmentId}/status`, { status: 'COMPLETED' });
      toast.success('Consultation completed!');
      router.push('/clinical/appointments/queue');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to complete'); }
    finally { setCompleting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#0D7C66] animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading consultation…</p>
        </div>
      </div>
    );
  }

  const patient = appointment?.patient;
  const doctor = appointment?.doctor;
  const patientName = `${patient?.firstName} ${patient?.lastName || ''}`.trim();
  const doctorName = `Dr. ${doctor?.user?.firstName} ${doctor?.user?.lastName || ''}`.trim();

  const totalBill = billItems.reduce((s: number, i: any) => s + i.total, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0D7C66] to-[#0A5E4F] rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
              {patient?.firstName?.[0]}{patient?.lastName?.[0] || ''}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{patientName}</h1>
                {patient?.bloodGroup && (
                  <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{patient.bloodGroup}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-emerald-200 text-xs mt-0.5">
                <span>{patient?.phone}</span>
                {appointment?.scheduledAt && <span>· {formatTime(appointment.scheduledAt)}</span>}
                <span>· {doctorName}</span>
                {appointment?.department?.name && <span>· {appointment.department.name}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={saveVisit} disabled={saving}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Notes
            </button>
            <button onClick={completeVisit} disabled={completing}
              className="flex items-center gap-2 bg-white text-[#0D7C66] text-sm font-bold px-5 py-2 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-60">
              {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Complete Consultation
            </button>
          </div>
        </div>

        {/* Allergies alert */}
        {patient?.allergies?.length > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-red-300 flex-shrink-0" />
            <p className="text-xs text-red-200"><strong className="text-red-100">Allergies:</strong> {patient.allergies.join(', ')}</p>
          </div>
        )}
        {patient?.chronicConditions?.length > 0 && (
          <div className="mt-2 flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2">
            <Activity className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <p className="text-xs text-amber-200"><strong className="text-amber-100">Conditions:</strong> {patient.chronicConditions.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'vitals',  label: 'Vitals & Notes',   icon: Activity },
          { key: 'rx',      label: 'Prescriptions',    icon: Pill },
          { key: 'billing', label: 'Billing',          icon: CreditCard },
        ].map((s: any) => (
          <button key={s.key} onClick={() => setActiveSection(s.key as any)}
            className={`flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-lg transition-all ${activeSection === s.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <s.icon className="w-4 h-4" />{s.label}
          </button>
        ))}
      </div>

      {/* ── Vitals & Notes Section ── */}
      {activeSection === 'vitals' && (
        <div className="space-y-4">
          <div className={sectionCls}>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" /> Vitals
            </h3>
            <VitalsPanel vitals={vitals} onChange={setVitals} />
          </div>

          <div className={sectionCls}>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#0D7C66]" /> Clinical Notes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <DictationTextarea
                  label="Chief Complaints"
                  placeholder="Fever for 3 days, headache, sore throat…"
                  rows={2} value={chiefComplaint} onChange={setChiefComplaint} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Diagnosis / Impression</label>
                <div className="relative">
                  <input className={inputCls} placeholder="Type or select…"
                    value={diagnosisText} onChange={e => setDiagnosisText(e.target.value)} />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COMMON_DIAGNOSES.slice(0, 8).map((d: any) => (
                      <button key={d} onClick={() => setDiagnosisText(d)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${diagnosisText === d ? 'bg-[#0D7C66] text-white border-[#0D7C66]' : 'border-slate-200 text-slate-500 hover:border-[#0D7C66] hover:text-[#0D7C66]'}`}>
                        {d.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <DictationTextarea
                  label="Clinical Notes / Examination"
                  placeholder="Throat congested, bilateral rhonchi, mild dehydration…"
                  rows={3} value={clinicalNotes} onChange={setClinicalNotes} />
              </div>
              <div>
                <DictationTextarea
                  label="Treatment Plan / Advice"
                  placeholder="Rest for 3 days, drink ORS, steam inhalation TDS…"
                  rows={3} value={treatmentPlan} onChange={setTreatmentPlan} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Follow-Up (days)</label>
                <input type="number" min={1} className={inputCls} placeholder="e.g. 7"
                  value={followUpDays} onChange={e => setFollowUpDays(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Prescription Section ── */}
      {activeSection === 'rx' && (
        <div className={sectionCls}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#0D7C66]" /> Medications
            </h3>
            <button onClick={() => setMedications(m => [...m, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0D7C66] hover:underline">
              <Plus className="w-3.5 h-3.5" /> Add Medication
            </button>
          </div>

          <div className="space-y-2">
            {medications.map((med, i) => (
              <MedRow key={i} med={med} index={i}
                onChange={m => setMedications(meds => meds.map((x, j) => j === i ? m : x))}
                onRemove={() => setMedications(meds => meds.filter((_, j) => j !== i))} />
            ))}
          </div>

          {/* Drug safety warnings */}
          {(() => {
            const warnings = checkDrugSafety(medications, patient?.allergies || []);
            if (warnings.length === 0) return null;
            return (
              <div className="space-y-2 mt-3">
                {warnings.map((w, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs font-medium border ${
                    w.level === 'HIGH'   ? 'bg-red-50 border-red-200 text-red-800' :
                    w.level === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{w.msg}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="bg-[#E8F5F0] rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-[#0A5E4F]">
              <Send className="w-3.5 h-3.5" />
              Prescription will be sent to {patient?.phone} via WhatsApp automatically
            </div>
            <button onClick={savePrescription} disabled={saving}
              className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
              Save Prescription
            </button>
          </div>
        </div>
      )}

      {/* ── Billing Section ── */}
      {activeSection === 'billing' && (
        <div className={sectionCls}>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0D7C66]" /> Bill Items
          </h3>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              <span className="col-span-5">Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-center">Price (₹)</span>
              <span className="col-span-2 text-right">Total (₹)</span>
              <span className="col-span-1" />
            </div>
            {billItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5">
                  <input className={inputCls} placeholder="Service description…"
                    value={item.description}
                    onChange={e => setBillItems(items => items.map((x, j) => j === i ? { ...x, description: e.target.value, total: x.quantity * x.unitPrice } : x))} />
                </div>
                <div className="col-span-2">
                  <input type="number" min={1} className={`${inputCls} text-center`}
                    value={item.quantity}
                    onChange={e => setBillItems(items => items.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value), total: Number(e.target.value) * x.unitPrice } : x))} />
                </div>
                <div className="col-span-2">
                  <input type="number" min={0} step={50} className={`${inputCls} text-center`}
                    value={item.unitPrice}
                    onChange={e => setBillItems(items => items.map((x, j) => j === i ? { ...x, unitPrice: Number(e.target.value), total: x.quantity * Number(e.target.value) } : x))} />
                </div>
                <div className="col-span-2 text-right">
                  <div className="px-3 py-2 bg-slate-50 rounded-xl text-sm font-bold text-slate-900 text-right">
                    ₹{item.total.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="col-span-1 flex justify-center">
                  <button onClick={() => setBillItems(items => items.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setBillItems(items => [...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])}
            className="text-xs font-semibold text-[#0D7C66] hover:underline flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div className="bg-[#E8F5F0] rounded-xl px-5 py-3">
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="text-2xl font-bold text-[#0D7C66]">₹{totalBill.toLocaleString('en-IN')}</p>
            </div>
            <button onClick={createInvoice} disabled={saving}
              className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Create Invoice & Send Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
