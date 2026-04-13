'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Video, Plus, RefreshCw, Search, X, Loader2,
  MessageSquare, Clock, CheckCircle2, Link as LinkIcon,
  Calendar, Phone, Copy, ExternalLink,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  CANCELLED:   'bg-red-100 text-red-700',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

// Generate a Jitsi Meet link (free, no signup needed)
const generateMeetLink = () => {
  const roomId = `hospibot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  return `https://meet.jit.si/${roomId}`;
};

export default function TelemedicinePage() {
  const [sessions, setSessions]   = useState<any[]>([]);
  const [doctors,  setDoctors]    = useState<any[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [showNew,  setShowNew]    = useState(false);
  const [saving,   setSaving]     = useState(false);
  const [patSearch,setPatSearch]  = useState('');
  const [patients, setPatients]   = useState<any[]>([]);
  const [form, setForm] = useState({ patientId:'', doctorId:'', scheduledAt:`${new Date().toISOString().slice(0,10)}T10:00`, duration:30, notes:'' });
  const [selectedPat, setSelectedPat] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, docRes] = await Promise.all([
        api.get('/appointments', { params: { type:'TELECONSULTATION', limit:30 } }),
        api.get('/doctors', { params: { limit:50, isActive:true } }),
      ]);
      setSessions(apptRes.data.data ?? []);
      setDoctors(docRes.data?.data ?? docRes.data ?? []);
    } catch { setSessions([]); setDoctors([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (patSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() =>
      api.get('/patients', { params: { search: patSearch, limit: 5 } })
        .then(r => setPatients(r.data.data ?? [])).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  const createSession = async () => {
    if (!form.patientId || !form.doctorId) { toast.error('Patient and doctor required'); return; }
    setSaving(true);
    try {
      const meetLink = generateMeetLink();
      await api.post('/appointments', {
        patientId: form.patientId,
        doctorId:  form.doctorId,
        scheduledAt: form.scheduledAt,
        type: 'TELECONSULTATION',
        notes: JSON.stringify({ meetLink, duration: form.duration, notes: form.notes }),
      });
      // Send WhatsApp with link to patient
      if (selectedPat?.phone) {
        await api.post('/whatsapp/send', {
          to: selectedPat.phone,
          message: `Your video consultation is scheduled for ${new Date(form.scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}.\n\nJoin here: ${meetLink}\n\nClick the link at appointment time. No download needed.`,
        }).catch(() => {});
      }
      toast.success('Teleconsultation scheduled! Video link sent via WhatsApp.');
      setShowNew(false);
      setForm({ patientId:'', doctorId:'', scheduledAt:`${new Date().toISOString().slice(0,10)}T10:00`, duration:30, notes:'' });
      setSelectedPat(null);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => toast.success('Link copied!'));
  };

  const sendReminder = async (session: any) => {
    const meta = (() => { try { return JSON.parse(session.notes||'{}'); } catch { return {}; } })();
    if (!session.patient?.phone) { toast.error('No phone number'); return; }
    await api.post('/whatsapp/send', {
      to: session.patient.phone,
      message: `Reminder: Your video consultation is in 30 minutes.\n\nJoin here: ${meta.meetLink || 'Contact reception for the link'}\n\nClick at appointment time. No download needed.`,
    });
    toast.success('Reminder sent via WhatsApp!');
  };

  const scheduled   = sessions.filter(s => s.status === 'SCHEDULED').length;
  const completed   = sessions.filter(s => s.status === 'COMPLETED').length;
  const inProgress  = sessions.filter(s => s.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-[#0D7C66]" /> Telemedicine
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Video consultations · Powered by Jitsi Meet (no download required)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
          <button onClick={()=>setShowNew(true)} className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4"/> Schedule Teleconsult
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:'Scheduled',    value: scheduled,         color:'#3B82F6'},
          {label:'In Progress',  value: inProgress,        color:'#8B5CF6'},
          {label:'Completed',    value: completed,         color:'#10B981'},
          {label:'Total Sessions',value: sessions.length,  color:'#0D7C66'},
        ].map(k=>(
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="text-3xl font-bold mt-1" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0D7C66] rounded-2xl p-5 text-white">
        <div className="flex items-start gap-4">
          <Video className="w-8 h-8 opacity-80 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-base">How Telemedicine Works</p>
            <p className="text-sm opacity-80 mt-1 leading-relaxed">
              1. Schedule a teleconsultation with a patient and doctor. 2. A unique Jitsi Meet video link is auto-generated. 3. Patient receives the link via WhatsApp instantly. 4. At appointment time, patient clicks the link — no app download needed. 5. Doctor joins from the HospiBot portal.
            </p>
          </div>
        </div>
      </div>

      {/* Sessions list */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Teleconsultation Sessions</h3>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">
            {['Date / Time','Patient','Doctor','Duration','Status','Meet Link','Actions'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? Array.from({length:4}).map((_,i)=>(
              <tr key={i}>{Array.from({length:7}).map((__,j)=><td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-200 rounded h-4"/></td>)}</tr>
            )) : sessions.length===0 ? (
              <tr><td colSpan={7} className="py-20 text-center">
                <Video className="w-14 h-14 text-slate-200 mx-auto mb-3"/>
                <p className="text-slate-400 text-sm">No teleconsultations scheduled</p>
                <button onClick={()=>setShowNew(true)} className="mt-3 text-sm font-semibold text-[#0D7C66] hover:underline">Schedule first session →</button>
              </td></tr>
            ) : sessions.map(s => {
              const meta = (() => { try { return JSON.parse(s.notes||'{}'); } catch { return {}; } })();
              return (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{formatDate(s.scheduledAt)}</p>
                    <p className="text-xs text-slate-400">{formatTime(s.scheduledAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{s.patient?.firstName} {s.patient?.lastName||''}</p>
                    <p className="text-xs text-slate-400">{s.patient?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{s.doctor?`Dr. ${s.doctor.user?.firstName||''} ${s.doctor.user?.lastName||''}`:' —'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{meta.duration||30} min</td>
                  <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status]||'bg-slate-100 text-slate-600'}`}>{s.status}</span></td>
                  <td className="px-4 py-3">
                    {meta.meetLink ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={()=>copyLink(meta.meetLink)} className="p-1.5 text-slate-400 hover:text-[#0D7C66] hover:bg-[#E8F5F0] rounded-lg transition-colors" title="Copy link">
                          <Copy className="w-3.5 h-3.5"/>
                        </button>
                        <a href={meta.meetLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-[#0D7C66] hover:underline">
                          <ExternalLink className="w-3.5 h-3.5"/> Join
                        </a>
                      </div>
                    ) : <span className="text-xs text-slate-300">No link</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {s.status==='SCHEDULED' && (
                        <button onClick={()=>sendReminder(s)} className="text-[11px] font-semibold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/30 px-2.5 py-1 rounded-lg hover:bg-[#25D366]/20">
                          Remind
                        </button>
                      )}
                      {meta.meetLink && s.status==='SCHEDULED' && (
                        <a href={meta.meetLink} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100">
                          Join
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Session Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowNew(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Schedule Teleconsultation</h2>
              <button onClick={()=>setShowNew(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Patient *</label>
                {selectedPat ? (
                  <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200">
                    <span className="text-sm font-semibold text-emerald-900">{selectedPat.firstName} {selectedPat.lastName||''} · {selectedPat.phone}</span>
                    <button onClick={()=>{setSelectedPat(null);setForm(f=>({...f,patientId:''}));}}><X className="w-4 h-4 text-emerald-400"/></button>
                  </div>
                ) : (
                  <div className="relative">
                    <input className={inputCls} placeholder="Search patient…" value={patSearch} onChange={e=>setPatSearch(e.target.value)} autoFocus />
                    {patients.length>0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10">
                        {patients.map(p=>(
                          <button key={p.id} onClick={()=>{setSelectedPat(p);setForm(f=>({...f,patientId:p.id}));setPatSearch('');setPatients([]);}}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm border-b last:border-0">
                            <p className="font-semibold">{p.firstName} {p.lastName||''}</p>
                            <p className="text-xs text-slate-400">{p.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Doctor *</label>
                <select className={inputCls} value={form.doctorId} onChange={e=>setForm(f=>({...f,doctorId:e.target.value}))}>
                  <option value="">Select doctor…</option>
                  {doctors.map(d=><option key={d.id} value={d.id}>Dr. {d.user?.firstName||''} {d.user?.lastName||''} — {d.specialties?.[0]||''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Date & Time *</label>
                  <input type="datetime-local" className={inputCls} value={form.scheduledAt} onChange={e=>setForm(f=>({...f,scheduledAt:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Duration (mins)</label>
                  <select className={inputCls} value={form.duration} onChange={e=>setForm(f=>({...f,duration:+e.target.value}))}>
                    {[15,20,30,45,60].map(d=><option key={d} value={d}>{d} minutes</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Pre-consultation notes</label>
                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Chief complaints, reason for consultation…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
              </div>
              <div className="bg-[#E8F5F0] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#0A5E4F]">
                <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                A unique video link will be auto-generated and sent to the patient via WhatsApp immediately. No app download needed — works in any browser.
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShowNew(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={createSession} disabled={saving} className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Video className="w-4 h-4"/>} Schedule & Send Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
