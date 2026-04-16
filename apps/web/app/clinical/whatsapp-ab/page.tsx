'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FlaskConical, Plus, RefreshCw, Play, Pause, Trophy,
  BarChart3, MessageSquare, TrendingUp, Users, CheckCircle2,
  X, Loader2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

interface ABTest {
  id: string;
  name: string;
  variantA: { name: string; template: string; sent: number; responses: number };
  variantB: { name: string; template: string; sent: number; responses: number };
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED';
  winner: 'A' | 'B' | null;
  startDate: string;
  totalSent: number;
}

const DEMO_TESTS: ABTest[] = [
  {
    id: '1',
    name: 'Follow-up reminder tone',
    variantA: {
      name: 'Professional',
      template: 'Dear {name}, your follow-up appointment is due. Please book at your earliest convenience.',
      sent: 250, responses: 87,
    },
    variantB: {
      name: 'Friendly',
      template: 'Hi {name}! 😊 Just a gentle reminder that it\'s time for your follow-up. Tap below to book!',
      sent: 250, responses: 124,
    },
    status: 'COMPLETED',
    winner: 'B',
    startDate: '2026-03-15',
    totalSent: 500,
  },
  {
    id: '2',
    name: 'Appointment reminder timing',
    variantA: { name: '24h before', template: 'You have an appointment tomorrow at {time} with {doctor}.', sent: 180, responses: 156 },
    variantB: { name: '2h before',  template: 'Reminder: Your appointment with {doctor} is in 2 hours at {time}.', sent: 180, responses: 171 },
    status: 'RUNNING',
    winner: null,
    startDate: '2026-04-01',
    totalSent: 360,
  },
];

export default function ABTestingPage() {
  const [tests,    setTests]    = useState<ABTest[]>(DEMO_TESTS);
  const [loading,  setLoading]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [templates,setTemplates]= useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    variantAName: 'Variant A', variantATemplate: '',
    variantBName: 'Variant B', variantBTemplate: '',
    sampleSize: '200',
  });

  useEffect(() => {
    api.get('/whatsapp/templates').then(r => setTemplates(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const createTest = async () => {
    if (!form.name || !form.variantATemplate || !form.variantBTemplate) {
      toast.error('Name and both variant templates required'); return;
    }
    setSaving(true);
    // Save to automation logs for persistence
    await api.post('/automation/rules', {
      name: `AB_TEST: ${form.name}`,
      trigger: 'MANUAL', action: 'SEND_WHATSAPP',
      conditions: {},
      message: JSON.stringify({
        abTest: true, testName: form.name,
        variantA: { name: form.variantAName, template: form.variantATemplate },
        variantB: { name: form.variantBName, template: form.variantBTemplate },
        sampleSize: form.sampleSize,
      }),
      isActive: false,
    }).catch(() => {}); // non-blocking
    const newTest: ABTest = {
      id: Date.now().toString(),
      name: form.name,
      variantA: { name: form.variantAName, template: form.variantATemplate, sent: 0, responses: 0 },
      variantB: { name: form.variantBName, template: form.variantBTemplate, sent: 0, responses: 0 },
      status: 'DRAFT', winner: null,
      startDate: new Date().toISOString().slice(0,10),
      totalSent: 0,
    };
    setTests(prev => [newTest, ...prev]);
    toast.success('A/B test created!');
    setShowNew(false);
    setSaving(false);
    setForm({ name:'', variantAName:'Variant A', variantATemplate:'', variantBName:'Variant B', variantBTemplate:'', sampleSize:'200' });
  };

  const toggleStatus = (id: string) => {
    setTests(prev => prev.map((t: any) => t.id === id
      ? { ...t, status: t.status === 'RUNNING' ? 'DRAFT' : 'RUNNING' }
      : t
    ));
    toast.success('Test status updated');
  };

  const responseRate = (v: { sent: number; responses: number }) =>
    v.sent > 0 ? ((v.responses / v.sent) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-[#0D7C66]" /> WhatsApp A/B Testing
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Test different message variants to optimize patient engagement</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4"/> New A/B Test
        </button>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0D7C66] rounded-2xl p-5 text-white">
        <p className="font-bold mb-2 flex items-center gap-2"><FlaskConical className="w-4 h-4"/> How A/B Testing Works</p>
        <div className="grid grid-cols-4 gap-4 text-sm opacity-90">
          {['1. Write two message variants', '2. Split your patient segment 50/50', '3. Send and track response rates', '4. Pick the winner automatically'].map((s,i) => (
            <div key={i} className="flex items-start gap-2"><span className="font-bold">{s}</span></div>
          ))}
        </div>
      </div>

      {/* Test cards */}
      <div className="space-y-4">
        {tests.map((test: any) => {
          const rateA = parseFloat(responseRate(test.variantA));
          const rateB = parseFloat(responseRate(test.variantB));
          const winnerVariant = test.winner ? (test.winner === 'A' ? test.variantA : test.variantB) : null;
          return (
            <div key={test.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{test.name}</h3>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      test.status==='COMPLETED'?'bg-emerald-100 text-emerald-700':
                      test.status==='RUNNING'?'bg-blue-100 text-blue-700':
                      'bg-slate-100 text-slate-600'
                    }`}>{test.status}</span>
                    {test.winner && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">🏆 Variant {test.winner} wins</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Started {test.startDate} · {test.totalSent} total sent</p>
                </div>
                {test.status !== 'COMPLETED' && (
                  <button onClick={() => toggleStatus(test.id)}
                    className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50">
                    {test.status === 'RUNNING' ? <><Pause className="w-4 h-4"/> Pause</> : <><Play className="w-4 h-4"/> Start</>}
                  </button>
                )}
              </div>

              {/* Variant comparison */}
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                {[
                  { ...test.variantA, label: 'A', color: '#3B82F6', rate: rateA },
                  { ...test.variantB, label: 'B', color: '#8B5CF6', rate: rateB },
                ].map((v: any) => (
                  <div key={v.label} className={`p-5 ${test.winner===v.label ? 'bg-amber-50/50' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-7 h-7 rounded-lg text-white text-xs font-black flex items-center justify-center`} style={{background:v.color}}>
                        {v.label}
                      </span>
                      <p className="text-sm font-bold text-slate-900">{v.name}</p>
                      {test.winner===v.label && <Trophy className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-xs text-slate-600 italic mb-3 leading-relaxed">"{v.template}"</div>
                    <div className="flex items-center justify-between text-sm">
                      <div><p className="text-xs text-slate-400">Sent</p><p className="font-bold text-slate-900">{v.sent}</p></div>
                      <div><p className="text-xs text-slate-400">Responses</p><p className="font-bold text-slate-900">{v.responses}</p></div>
                      <div>
                        <p className="text-xs text-slate-400">Response Rate</p>
                        <p className="font-bold text-lg" style={{color:v.color}}>{v.rate}%</p>
                      </div>
                    </div>
                    <div className="mt-2 bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{width:`${Math.min(100,v.rate*2)}%`,background:v.color}} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison chart */}
              {(test.variantA.sent > 0 || test.variantB.sent > 0) && (
                <div className="px-5 py-4 border-t border-slate-100">
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={[{ name:'Sent', A:test.variantA.sent, B:test.variantB.sent }, { name:'Responses', A:test.variantA.responses, B:test.variantB.responses }]}>
                      <XAxis dataKey="name" tick={{fontSize:11}} />
                      <Tooltip />
                      <Bar dataKey="A" fill="#3B82F6" name="Variant A" radius={[3,3,0,0]} />
                      <Bar dataKey="B" fill="#8B5CF6" name="Variant B" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowNew(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">New A/B Test</h2>
              <button onClick={()=>setShowNew(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Test Name *</label>
                <input className={inputCls} placeholder="e.g., Appointment reminder tone" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-5">
                {(['A','B'] as const).map((v: any) => (
                  <div key={v} className={`space-y-3 p-4 rounded-2xl border-2 ${v==='A'?'border-blue-200 bg-blue-50/30':'border-purple-200 bg-purple-50/30'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg text-white text-xs font-black flex items-center justify-center ${v==='A'?'bg-blue-500':'bg-purple-500'}`}>{v}</span>
                      <input className="text-sm font-bold bg-transparent outline-none border-b border-transparent focus:border-current text-slate-900"
                        value={v==='A'?form.variantAName:form.variantBName}
                        onChange={e=>setForm(f=>v==='A'?{...f,variantAName:e.target.value}:{...f,variantBName:e.target.value})} />
                    </div>
                    <textarea rows={4} className={`${inputCls} resize-none`}
                      placeholder={`Write Variant ${v} message…\nUse {name}, {doctor}, {date} as variables`}
                      value={v==='A'?form.variantATemplate:form.variantBTemplate}
                      onChange={e=>setForm(f=>v==='A'?{...f,variantATemplate:e.target.value}:{...f,variantBTemplate:e.target.value})} />
                  </div>
                ))}
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Sample Size per Variant</label>
                <select className={inputCls} value={form.sampleSize} onChange={e=>setForm(f=>({...f,sampleSize:e.target.value}))}>
                  {['50','100','200','500','1000'].map((n: any) =><option key={n} value={n}>{n} patients</option>)}
                </select></div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShowNew(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={createTest} disabled={saving}
                className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<FlaskConical className="w-4 h-4"/>} Create Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
