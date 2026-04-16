'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  User, Calendar, Pill, FlaskConical, CreditCard,
  Shield, MessageSquare, Phone, Search, CheckCircle2,
  Clock, Download, Star, AlertTriangle, Activity,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

type Tab = 'overview' | 'appointments' | 'prescriptions' | 'reports' | 'billing';

export default function PatientPortalPage() {
  const [phone,    setPhone]    = useState('');
  const [patient,  setPatient]  = useState<any>(null);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState<Tab>('overview');
  const [otp,      setOtp]      = useState('');
  const [otpSent,  setOtpSent]  = useState(false);
  const [verified, setVerified] = useState(false);

  const sendOTP = async () => {
    if (!phone || phone.replace(/\D/g,'').length < 10) { toast.error('Enter valid phone number'); return; }
    setLoading(true);
    try {
      // In production, send real OTP via WhatsApp. For demo, use 1234.
      await api.post('/whatsapp/send', {
        to: phone,
        message: `Your HospiBot Patient Portal OTP is: *1234*\nValid for 10 minutes. Do not share with anyone.`,
      }).catch(() => {});
      setOtpSent(true);
      toast.success('OTP sent to your WhatsApp!');
    } catch { toast.error('Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp !== '1234') { toast.error('Invalid OTP'); return; } // Demo OTP
    setLoading(true);
    try {
      const res = await api.get(`/patients/lookup/phone/${phone.replace(/\D/g,'').slice(-10)}`);
      if (res.data) {
        setPatient(res.data);
        setVerified(true);
        toast.success(`Welcome, ${res.data.firstName}!`);
      } else {
        toast.error('No record found for this phone number');
      }
    } catch { toast.error('Patient not found. Please visit the hospital to register.'); }
    finally { setLoading(false); }
  };

  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D7C66] to-[#0A5E4F] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#0D7C66] to-[#0A5E4F] px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Patient Portal</h1>
            <p className="text-white/70 text-sm mt-1">Access your health records securely</p>
          </div>
          <div className="px-6 py-8 space-y-4">
            {!otpSent ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Mobile Number</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl bg-slate-50 px-3 py-2.5">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
                      placeholder="+91 98765 43210" value={phone} onChange={e=>setPhone(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&sendOTP()} type="tel" />
                  </div>
                </div>
                <button onClick={sendOTP} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors">
                  {loading ? 'Sending…' : <><MessageSquare className="w-4 h-4"/> Send OTP via WhatsApp</>}
                </button>
                <p className="text-xs text-center text-slate-400">We'll send a one-time password to your WhatsApp</p>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Enter OTP</label>
                  <input className={inputCls} placeholder="Enter 4-digit OTP" value={otp} onChange={e=>setOtp(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&verifyOTP()} maxLength={6} autoFocus />
                  <p className="text-xs text-slate-400 mt-1.5">OTP sent to {phone}</p>
                </div>
                <button onClick={verifyOTP} disabled={loading}
                  className="w-full bg-[#0D7C66] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50">
                  {loading ? 'Verifying…' : 'Verify & Login'}
                </button>
                <button onClick={()=>{setOtpSent(false);setOtp('');}} className="w-full text-sm text-slate-500 hover:text-slate-700">← Change number</button>
                <p className="text-xs text-center text-slate-400 bg-amber-50 border border-amber-200 rounded-xl p-2">Demo OTP: <strong>1234</strong></p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Patient Dashboard ───────────────────────────────────────────────────
  const ageYears = patient?.dateOfBirth ? Math.floor((Date.now()-new Date(patient.dateOfBirth).getTime())/(1000*60*60*24*365.25)) : null;
  const tabs: {key:Tab;label:string;icon:any;count?:number}[] = [
    { key:'overview',      label:'Overview',      icon:Activity  },
    { key:'appointments',  label:'Appointments',  icon:Calendar,  count: patient?.appointments?.length },
    { key:'prescriptions', label:'Prescriptions', icon:Pill,      count: patient?.prescriptions?.filter((r:any)=>r.isActive).length },
    { key:'reports',       label:'Lab Reports',   icon:FlaskConical, count: patient?.labOrders?.length },
    { key:'billing',       label:'Billing',       icon:CreditCard, count: patient?.invoices?.filter((i:any)=>i.dueAmount>0).length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0D7C66] to-[#0A5E4F] px-6 py-5 text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white text-lg font-bold flex items-center justify-center">
              {patient?.firstName?.[0]}{patient?.lastName?.[0]||''}
            </div>
            <div>
              <h1 className="text-lg font-bold">{patient?.firstName} {patient?.lastName||''}</h1>
              <p className="text-white/70 text-sm">{ageYears !== null ? `${ageYears} yrs` : ''}{patient?.gender ? ` · ${patient.gender}` : ''} · Health ID: {patient?.healthId||'—'}</p>
            </div>
          </div>
          <button onClick={()=>{setVerified(false);setPatient(null);setPhone('');setOtp('');setOtpSent(false);}}
            className="text-white/70 hover:text-white text-sm font-medium">Logout</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Critical alerts */}
        {(patient?.allergies?.length > 0 || patient?.chronicConditions?.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              {patient?.allergies?.length > 0 && <p className="text-sm font-semibold text-amber-800">Allergies: {patient.allergies.join(', ')}</p>}
              {patient?.chronicConditions?.length > 0 && <p className="text-sm text-amber-700 mt-0.5">Chronic Conditions: {patient.chronicConditions.join(', ')}</p>}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1.5 overflow-x-auto">
          {tabs.map((t: any) => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl whitespace-nowrap transition-all ${tab===t.key?'bg-[#0D7C66] text-white shadow-sm':'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              <t.icon className="w-4 h-4"/>
              {t.label}
              {t.count ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab===t.key?'bg-white/20 text-white':'bg-slate-100 text-slate-600'}`}>{t.count}</span> : null}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-[#0D7C66]"/> Personal Details</h3>
              <div className="space-y-2.5">
                {[
                  ['Name', `${patient?.firstName} ${patient?.lastName||''}`],
                  ['Phone', patient?.phone||'—'],
                  ['Email', patient?.email||'—'],
                  ['Blood Group', patient?.bloodGroup||'—'],
                  ['Date of Birth', patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN') : '—'],
                  ['Health ID', patient?.healthId||'—'],
                  ['Insurance', patient?.insuranceProvider||'None'],
                ].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                    <p className="text-xs text-slate-400 font-medium">{k}</p>
                    <p className="text-sm font-semibold text-slate-900">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#0D7C66]"/> Next Appointment</h3>
                {patient?.appointments?.[0] ? (
                  <div className="bg-[#E8F5F0] rounded-xl p-3">
                    <p className="text-sm font-bold text-[#0D7C66]">{formatDate(patient.appointments[0].scheduledAt)}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{formatTime(patient.appointments[0].scheduledAt)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{patient.appointments[0].doctor?.user?.firstName ? `Dr. ${patient.appointments[0].doctor.user.firstName}` : 'Doctor TBD'}</p>
                  </div>
                ) : <p className="text-sm text-slate-400">No upcoming appointments</p>}
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#0D7C66]"/> Outstanding Balance</h3>
                {(() => {
                  const totalDue = (patient?.invoices||[]).reduce((s: any, i: any) =>s+(i.dueAmount||0),0);
                  return totalDue > 0 ? (
                    <div className="bg-red-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-red-600">{formatINR(totalDue)}</p>
                      <p className="text-xs text-red-500 mt-0.5">Please clear dues at next visit</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <p className="text-sm font-semibold">No outstanding dues</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Appointments */}
        {tab === 'appointments' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100"><h3 className="font-bold text-slate-900">Appointment History</h3></div>
            {!patient?.appointments?.length ? (
              <div className="py-16 text-center"><Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-sm">No appointments found</p></div>
            ) : (
              <table className="w-full"><thead><tr className="border-b border-slate-100">{['Date','Time','Doctor','Status'].map((h: any) =><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {patient.appointments.map((a:any) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatDate(a.scheduledAt)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatTime(a.scheduledAt)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{a.doctor?.user?.firstName ? `Dr. ${a.doctor.user.firstName} ${a.doctor.user.lastName||''}` : '—'}</td>
                    <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${a.status==='COMPLETED'?'bg-emerald-100 text-emerald-700':a.status==='CANCELLED'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        )}

        {/* Prescriptions */}
        {tab === 'prescriptions' && (
          <div className="space-y-3">
            {!patient?.prescriptions?.length ? (
              <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center"><Pill className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-sm">No prescriptions found</p></div>
            ) : patient.prescriptions.map((rx:any) => (
              <div key={rx.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-900">{formatDate(rx.createdAt)}</p>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${rx.isActive?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{rx.isActive?'Active':'Expired'}</span>
                </div>
                {(rx.medications as any[])?.map((m:any,i:number) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                    <Pill className="w-4 h-4 text-[#0D7C66] flex-shrink-0 mt-0.5"/>
                    <div><p className="text-sm font-semibold text-slate-900">{m.name} {m.dosage||''}</p><p className="text-xs text-slate-400">{m.frequency} · {m.duration}</p></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Lab Reports */}
        {tab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100"><h3 className="font-bold text-slate-900">Lab Reports</h3></div>
            {!patient?.labOrders?.length ? (
              <div className="py-16 text-center"><FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-sm">No lab reports found</p></div>
            ) : (
              <table className="w-full"><thead><tr className="border-b border-slate-100">{['Date','Tests','Status','Report'].map((h: any) =><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {patient.labOrders.map((l:any) => (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{(l.tests as any[])?.map((t:any)=>t.name||t).join(', ')||'—'}</td>
                    <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${l.status==='REPORTED'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{l.status}</span></td>
                    <td className="px-4 py-3">{l.reportUrl?<a href={l.reportUrl} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs font-semibold text-[#0D7C66] hover:underline"><Download className="w-3.5 h-3.5"/>Download</a>:<span className="text-xs text-slate-400">Not yet</span>}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        )}

        {/* Billing */}
        {tab === 'billing' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100"><h3 className="font-bold text-slate-900">Billing History</h3></div>
            {!patient?.invoices?.length ? (
              <div className="py-16 text-center"><CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-sm">No billing records found</p></div>
            ) : (
              <table className="w-full"><thead><tr className="border-b border-slate-100">{['Invoice','Date','Total','Paid','Due','Status'].map((h: any) =><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {patient.invoices.map((inv:any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatINR(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{formatINR(inv.paidAmount)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600">{inv.dueAmount>0?formatINR(inv.dueAmount):'—'}</td>
                    <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${inv.status==='PAID'?'bg-emerald-100 text-emerald-700':inv.status==='PARTIAL'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
