'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { RefreshCw, TrendingUp, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
const NAV_COLOR = '#6B21A8';
export default function HomecareAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week'|'month'>('month');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => ({ data: {} })),
        api.get(`/analytics/appointments?days=${period==='week'?7:30}`).catch(() => ({ data: [] })),
      ]);
      setStats(s.data);
      setTrend(Array.isArray(t.data) ? t.data : []);
    } catch {} finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);
  const d = stats || {};
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Home Care Analytics</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['week','month'] as const).map(p=>(
              <button key={p} onClick={()=>setPeriod(p)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${period===p?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>{p}</button>
            ))}
          </div>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[
            {l:'Monthly Revenue',v:formatINR(d.monthRevenue??0),icon:TrendingUp},
            {l:'Active Clients',v:d.totalPatients??0,icon:Users},
            {l:'Visits This Month',v:d.monthAppointments??0,icon:Calendar},
            {l:'Completed Visits',v:d.completedAppointments??0,icon:CheckCircle2},
          ].map(k=>(
            <div key={k.l} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-2"><k.icon className="w-4 h-4" style={{color:NAV_COLOR}}/><p className="text-xs text-slate-500">{k.l}</p></div>
              <p className="text-2xl font-bold text-slate-900">{k.v}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Visit Trends</h3>
        {trend.length>0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{top:0,right:0,left:-10,bottom:0}}>
              <defs><linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={NAV_COLOR} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={NAV_COLOR} stopOpacity={0}/>
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v:string)=>v?.slice(5)||v}/>
              <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:12,border:'none',fontSize:12}}/>
              <Area type="monotone" dataKey="count" stroke={NAV_COLOR} strokeWidth={2.5} fill="url(#hcGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No visit data yet</div>
        )}
      </div>
    </div>
  );
}
