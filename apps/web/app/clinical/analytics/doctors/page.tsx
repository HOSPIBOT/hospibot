'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Stethoscope, RefreshCw, TrendingUp, Download, Star, Users, IndianRupee } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DoctorAnalyticsPage() {
  const [topDoctors, setTopDoctors] = useState<any[]>([]);
  const [doctors,    setDoctors]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(false);
  const [period,     setPeriod]     = useState<'week'|'month'|'year'>('month');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [topRes, allRes] = await Promise.all([
        api.get('/analytics/doctors/top', { params: { period, limit: 10 } }),
        api.get('/doctors', { params: { limit: 50, isActive: true } }),
      ]);
      setTopDoctors(topRes.data ?? []);
      setDoctors(allRes.data?.data ?? allRes.data ?? []);
    } catch { setTopDoctors([]); setDoctors([]); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const chartData = topDoctors.map((d: any) => ({
    name: `Dr. ${(d.firstName||d.user?.firstName||'').slice(0,8)}`,
    appointments: d.appointmentCount || d.totalAppointments || 0,
    revenue: Math.round((d.revenue || d.totalRevenue || 0) / 100),
  }));

  const totalAppts   = topDoctors.reduce((s: any, d: any) => s + (d.appointmentCount||0), 0);
  const totalRevenue = topDoctors.reduce((s: any, d: any) => s + (d.revenue||d.totalRevenue||0), 0);

  const exportCSV = () => {
    setExporting(true);
    const header = ['Doctor','Specialties','Appointments','Revenue','Avg Rating'];
    const rows = topDoctors.map((d: any) => [
      `Dr. ${d.firstName||d.user?.firstName||''} ${d.lastName||d.user?.lastName||''}`.trim(),
      d.specialties?.join(', ')||'—',
      d.appointmentCount||0,
      `₹${((d.revenue||d.totalRevenue||0)/100).toLocaleString('en-IN')}`,
      d.avgRating||'—',
    ]);
    const csv=[header,...rows].map((r: any) =>r.map((v: any) =>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`doctor-analytics-${period}.csv`;a.click();URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Stethoscope className="w-6 h-6 text-[#0D7C66]" /> Doctor Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">{topDoctors.length} doctors ranked · {period} view</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['week','month','year'] as const).map((p: any) =>(
              <button key={p} onClick={()=>setPeriod(p)} className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${period===p?'bg-white text-slate-900 shadow-sm':'text-slate-500'}`}>{p}</button>
            ))}
          </div>
          <button onClick={exportCSV} disabled={exporting} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            <Download className="w-4 h-4"/> {exporting?'Exporting…':'Export'}
          </button>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Total Appointments',value:totalAppts.toLocaleString('en-IN'),color:'#3B82F6',icon:Users},
          {label:'Total Revenue',value:formatINR(totalRevenue),color:'#0D7C66',icon:IndianRupee},
          {label:'Active Doctors',value:doctors.length,color:'#8B5CF6',icon:Stethoscope},
        ].map((k: any) =>(
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${k.color}15`}}>
              <k.icon className="w-5 h-5" style={{color:k.color}}/>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{k.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{color:k.color}}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Appointments by Doctor</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:11}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10}} width={80}/>
              <Tooltip/>
              <Bar dataKey="appointments" fill="#3B82F6" radius={[0,4,4,0]} name="Appointments"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue by Doctor</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:11}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10}} width={80}/>
              <Tooltip formatter={(v:any)=>`₹${v.toLocaleString('en-IN')}`}/>
              <Bar dataKey="revenue" fill="#0D7C66" radius={[0,4,4,0]} name="Revenue"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100"><h3 className="font-bold text-slate-900">Doctor Leaderboard</h3></div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">
            {['Rank','Doctor','Specialties','Appointments','Revenue','Rating'].map((h: any) =><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? Array.from({length:5}).map((_,i)=>(<tr key={i}>{Array.from({length:6}).map((__,j)=><td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-200 rounded h-4"/></td>)}</tr>))
            : topDoctors.length===0 ? <tr><td colSpan={6} className="py-16 text-center text-slate-400 text-sm">No doctor analytics available</td></tr>
            : topDoctors.map((d,i)=>(
              <tr key={d.id||i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3"><span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center ${i===0?'bg-amber-100 text-amber-700':i===1?'bg-slate-100 text-slate-600':i===2?'bg-orange-100 text-orange-700':'bg-slate-50 text-slate-500'}`}>#{i+1}</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl bg-[#0D7C66] text-white text-xs font-bold flex items-center justify-center">{(d.firstName||d.user?.firstName||'D')[0]}{(d.lastName||d.user?.lastName||'R')[0]}</div><div><p className="text-sm font-semibold text-slate-900">Dr. {d.firstName||d.user?.firstName||''} {d.lastName||d.user?.lastName||''}</p></div></div></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(d.specialties||[]).slice(0,2).map((s:string)=><span key={s} className="text-[10px] font-medium bg-[#E8F5F0] text-[#0D7C66] px-2 py-0.5 rounded-full">{s}</span>)}</div></td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">{(d.appointmentCount||d.totalAppointments||0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm font-bold text-[#0D7C66]">{formatINR(d.revenue||d.totalRevenue||0)}</td>
                <td className="px-4 py-3">{d.avgRating?<div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400"/><span className="text-sm font-bold text-slate-900">{d.avgRating.toFixed(1)}</span></div>:<span className="text-sm text-slate-300">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
