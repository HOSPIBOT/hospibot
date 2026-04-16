'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Search, Plus, X, Loader2, User, FlaskConical, CreditCard,
  Phone, Calendar, ChevronRight, Check, AlertTriangle, Home,
  Zap, CheckCircle2,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

type Step = 1 | 2 | 3;

interface SelectedTest {
  testId: string;
  testCode: string;
  testName: string;
  department?: string;
  price: number;
  isStat?: boolean;
}

// ── Patient Search ────────────────────────────────────────────────────────────
function PatientSearch({ onSelect }: { onSelect: (p: any) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); setShow(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/patients', { params: { search: q, limit: 8 } });
        setResults(res.data.data ?? res.data ?? []);
        setShow(true);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className={`${inputCls} pl-10`} placeholder="Search by name or mobile number…"
          value={q} onChange={e => setQ(e.target.value)} onFocus={() => results.length > 0 && setShow(true)} />
        {loading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E3A5F] animate-spin" />}
      </div>
      {show && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white rounded-2xl shadow-xl border border-slate-100 mt-2 overflow-hidden">
          {results.map((p: any) => (
            <button key={p.id} onClick={() => { onSelect(p); setQ(''); setShow(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center text-sm font-bold text-[#1E3A5F] flex-shrink-0">
                {(p.firstName?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
                <p className="text-xs text-slate-400">{p.phone} {p.healthId ? `· ${p.healthId}` : ''}</p>
              </div>
              <span className="text-xs text-slate-400">{p.gender} · {p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() + 'y' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Test Catalog Search ──────────────────────────────────────────────────────
function TestSearch({ selected, onAdd, onRemove }: {
  selected: SelectedTest[]; onAdd: (t: SelectedTest) => void; onRemove: (code: string) => void;
}) {
  const [q, setQ] = useState('');
  const [catalog, setCatalog] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    api.get('/diagnostic/catalog').catch(() => api.get('/lab/catalog'))
      .then(res => {
        const data = res.data.data ?? [];
        setCatalog(data);
        setFiltered(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let f = catalog;
    if (q) f = f.filter((t: any) =>
      t.name.toLowerCase().includes(q.toLowerCase()) || t.code.toLowerCase().includes(q.toLowerCase())
    );
    if (activeCategory !== 'All') f = f.filter((t: any) => t.category === activeCategory);
    setFiltered(f);
  }, [q, activeCategory, catalog]);

  const categories = ['All', ...Array.from(new Set(catalog.map((t: any) => t.category))).sort()];

  return (
    <div className="space-y-4">
      {/* Selected tests */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Selected Tests ({selected.length})</p>
          {selected.map((t: any) => (
            <div key={t.testCode} className="flex items-center gap-3 bg-[#1E3A5F]/5 border border-[#1E3A5F]/15 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#0D7C66] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{t.testName}</p>
                <p className="text-xs text-slate-400">{t.testCode} · {t.department}</p>
              </div>
              <p className="text-sm font-bold text-[#1E3A5F]">{formatINR(t.price * 100)}</p>
              <button onClick={() => onRemove(t.testCode)} className="text-slate-400 hover:text-red-500 transition-colors ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className={`${inputCls} pl-10`} placeholder="Search tests (CBC, HbA1c, LFT…)"
          value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c: any) => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === c ? 'text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
            style={activeCategory === c ? { background: NAVY } : {}}>
            {c}
          </button>
        ))}
      </div>

      {/* Test list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-12 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {filtered.map((t: any) => {
            const isSelected = selected.some((s: any) => s.testCode === t.code);
            return (
              <button key={t.id} onClick={() => isSelected ? onRemove(t.code) : onAdd({
                testId: t.id, testCode: t.code, testName: t.name,
                department: t.category, price: t.price,
              })}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-[#1E3A5F]/5 border-[#1E3A5F]/20'
                    : 'bg-white border-slate-100 hover:border-[#1E3A5F]/30 hover:bg-slate-50'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-[#0D7C66]' : 'bg-slate-100'
                }`}>
                  {isSelected
                    ? <Check className="w-4 h-4 text-white" />
                    : <FlaskConical className="w-3.5 h-3.5 text-slate-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-[#1E3A5F]' : 'text-slate-900'}`}>{t.name}</p>
                  <p className="text-xs text-slate-400">{t.code} · {t.category} · {t.turnaroundHrs}h TAT</p>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${isSelected ? 'text-[#0D7C66]' : 'text-slate-700'}`}>
                  {formatINR(t.price * 100)}
                </p>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-sm">No tests found for "{q}"</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function NewOrderPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Patient state
  const [patient, setPatient] = useState<any>(null);

  // Pre-fill patient if patientId is in URL
  useEffect(() => {
    const pid = searchParams?.get('patientId');
    if (pid && !patient) {
      api.get('/patients/' + pid).then(r => setPatient(r.data)).catch(() => {});
    }
  }, []);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '', lastName: '', phone: '', gender: 'Male',
    dateOfBirth: '', address: '', email: '',
  });

  // Order state
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [isStat, setIsStat] = useState(false);
  const [collectionMode, setCollectionMode] = useState<'WALKIN' | 'HOME_COLLECTION'>('WALKIN');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');

  const totalAmount = selectedTests.reduce((s: number, t: any) => s + t.price, 0);
  const statPremium = isStat ? 200 : 0;
  const grandTotal = totalAmount + statPremium;

  const createPatient = async () => {
    if (!newPatientForm.firstName || !newPatientForm.phone) {
      toast.error('First name and phone are required');
      return null;
    }
    const res = await api.post('/patients', newPatientForm);
    return res.data;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!patient && !isNewPatient) { toast.error('Select or register a patient'); return; }
      if (isNewPatient) {
        try {
          const created = await createPatient();
          if (!created) return;
          setPatient(created);
          setIsNewPatient(false);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Failed to create patient');
          return;
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedTests.length === 0) { toast.error('Select at least one test'); return; }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/diagnostic/orders', {
        patientId: patient.id,
        tests: selectedTests,
        isStat, collectionMode, referringDoctor, clinicalInfo, notes,
      }).catch(() => api.post('/lab/orders', {
        patientId: patient.id,
        tests: selectedTests.map((t: any) => ({ testName: t.testName, testCode: t.testCode, price: t.price * 100 })),
        isStat, referringDoctor, clinicalInfo, notes, priority: isStat ? 'stat' : 'normal',
      }));

      toast.success(`Order ${res.data.orderNumber} created! Barcode: ${res.data.barcode ?? res.data.sampleBarcode ?? '—'}`);
      router.push(`/diagnostic/lab-orders/${res.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create order');
    } finally { setSubmitting(false); }
  };

  const setNPF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setNewPatientForm(f => ({ ...f, [k]: e.target.value }));

  const STEPS = [
    { n: 1, label: 'Patient' },
    { n: 2, label: 'Tests' },
    { n: 3, label: 'Confirm' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep((step - 1) as Step) : router.back()}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">New Lab Order</h1>
          <p className="text-sm text-slate-500">Register patient and select tests</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                step > s.n ? 'bg-[#0D7C66] text-white' :
                step === s.n ? 'text-white' : 'bg-slate-100 text-slate-400'
              }`} style={step === s.n ? { background: NAVY } : {}}>
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-sm font-semibold ${step >= s.n ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${step > s.n ? 'bg-[#0D7C66]' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Patient */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Patient Details</h2>
            <button onClick={() => setIsNewPatient(!isNewPatient)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border ${
                isNewPatient ? 'bg-slate-100 text-slate-600 border-slate-200' : 'text-white border-transparent'
              }`} style={!isNewPatient ? { background: TEAL } : {}}>
              {isNewPatient ? 'Search Existing' : '+ New Patient'}
            </button>
          </div>

          {!isNewPatient ? (
            <div className="space-y-4">
              <PatientSearch onSelect={p => { setPatient(p); }} />
              {patient && (
                <div className="flex items-center gap-4 bg-[#1E3A5F]/5 border border-[#1E3A5F]/15 rounded-2xl p-4">
                  <div className="w-12 h-12 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {patient.firstName?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{patient.firstName} {patient.lastName}</p>
                    <p className="text-sm text-slate-500">{patient.phone} · {patient.gender} · {patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() + ' years' : ''}</p>
                    {patient.healthId && <p className="text-xs font-mono text-slate-400 mt-0.5">ID: {patient.healthId}</p>}
                  </div>
                  <button onClick={() => setPatient(null)} className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="Rahul" value={newPatientForm.firstName} onChange={setNPF('firstName')} />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input className={inputCls} placeholder="Sharma" value={newPatientForm.lastName} onChange={setNPF('lastName')} />
              </div>
              <div>
                <label className={labelCls}>Mobile <span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="9876543210" type="tel" value={newPatientForm.phone} onChange={setNPF('phone')} />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select className={inputCls} value={newPatientForm.gender} onChange={setNPF('gender')}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input className={inputCls} type="date" value={newPatientForm.dateOfBirth} onChange={setNPF('dateOfBirth')} />
              </div>
              <div>
                <label className={labelCls}>Email (optional)</label>
                <input className={inputCls} placeholder="rahul@email.com" type="email" value={newPatientForm.email} onChange={setNPF('email')} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Address (optional)</label>
                <input className={inputCls} placeholder="Flat 4B, Jubilee Hills, Hyderabad" value={newPatientForm.address} onChange={setNPF('address')} />
              </div>
            </div>
          )}

          {/* Collection mode */}
          <div>
            <label className={labelCls}>Collection Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: 'WALKIN', label: 'Walk-in at Lab', icon: FlaskConical },
                { v: 'HOME_COLLECTION', label: 'Home Collection', icon: Home },
              ].map((m: any) => (
                <button key={m.v} onClick={() => setCollectionMode(m.v as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    collectionMode === m.v ? 'border-[#1E3A5F] bg-[#1E3A5F]/5' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <m.icon className={`w-5 h-5 flex-shrink-0 ${collectionMode === m.v ? 'text-[#1E3A5F]' : 'text-slate-400'}`} />
                  <span className={`text-sm font-semibold ${collectionMode === m.v ? 'text-[#1E3A5F]' : 'text-slate-600'}`}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STAT toggle */}
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">STAT / Urgent Order</p>
              <p className="text-xs text-red-500">Priority processing + ₹200 surcharge. Results within 1-2 hours.</p>
            </div>
            <button onClick={() => setIsStat(!isStat)}
              className={`w-12 h-6 rounded-full transition-all flex-shrink-0 ${isStat ? 'bg-red-500' : 'bg-slate-300'}`}>
              <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${isStat ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <button onClick={handleNext} disabled={!patient && !isNewPatient}
            className="w-full py-3 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
            style={{ background: NAVY }}>
            Continue to Test Selection →
          </button>
        </div>
      )}

      {/* Step 2: Tests */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-bold text-slate-900">Select Tests</h2>
          <TestSearch
            selected={selectedTests}
            onAdd={t => setSelectedTests(p => [...p, t])}
            onRemove={code => setSelectedTests(p => p.filter((x: any) => x.testCode !== code))}
          />

          {/* Clinical info */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className={labelCls}>Referring Doctor (optional)</label>
              <input className={inputCls} placeholder="Dr. Priya Sharma" value={referringDoctor} onChange={e => setReferringDoctor(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Clinical Information</label>
              <input className={inputCls} placeholder="Known diabetic, on metformin" value={clinicalInfo} onChange={e => setClinicalInfo(e.target.value)} />
            </div>
          </div>

          {selectedTests.length > 0 && (
            <div className="flex items-center justify-between bg-[#1E3A5F]/5 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-slate-900">{selectedTests.length} tests selected</p>
              <p className="text-lg font-black text-[#1E3A5F]">{formatINR((totalAmount + statPremium) * 100)}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm">
              Back
            </button>
            <button onClick={handleNext} disabled={selectedTests.length === 0}
              className="flex-[3] py-2.5 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 text-sm"
              style={{ background: NAVY }}>
              Review Order →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-bold text-slate-900">Confirm Order</h2>

          {/* Patient summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Patient</p>
            <p className="font-bold text-slate-900">{patient?.firstName} {patient?.lastName}</p>
            <p className="text-sm text-slate-500">{patient?.phone} · {patient?.gender}</p>
          </div>

          {/* Tests summary */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tests ({selectedTests.length})</p>
            {selectedTests.map((t: any) => (
              <div key={t.testCode} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.testName}</p>
                  <p className="text-xs text-slate-400">{t.testCode} · {t.department}</p>
                </div>
                <p className="text-sm font-bold text-slate-700">{formatINR(t.price * 100)}</p>
              </div>
            ))}
            {isStat && (
              <div className="flex items-center justify-between py-2">
                <p className="text-sm text-red-700 font-semibold flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> STAT Premium</p>
                <p className="text-sm font-bold text-red-700">{formatINR(20000)}</p>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-t border-slate-100 mt-2">
              <p className="text-sm font-black text-slate-900">Total</p>
              <p className="text-xl font-black text-[#1E3A5F]">{formatINR(grandTotal * 100)}</p>
            </div>
          </div>

          {/* Payment mode */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Payment Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'UPI', 'CARD'].map((m: any) => (
                <button key={m} onClick={() => setPaymentMode(m)}
                  className={`py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${
                    paymentMode === m ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]' : 'border-slate-200 text-slate-600'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm">
              Back
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-[3] py-3 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              style={{ background: NAVY }}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Order…</> : `Create Order · ${formatINR(grandTotal * 100)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto space-y-4">{Array.from({length:3}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>}>
      <NewOrderPageInner />
    </Suspense>
  );
}
