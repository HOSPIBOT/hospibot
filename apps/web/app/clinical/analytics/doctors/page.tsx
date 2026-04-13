'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { RefreshCw, Award, TrendingUp, Calendar, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DoctorAnalyticsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<'week'|'month'>('month');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/doctors/top?limit=10&period=${period}`);
      setDoctors(res.data ?? []);
    } catch { } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const maxAppts = Math.max(...doctors.map(d => d.appointmentCount || d.totalAppointments || 0), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Performance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Appointments and revenue by doctor</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['week','month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-16"/>)}</div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Award className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm">No doctor data yet</p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Appointments by Doctor</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={doctors.slice(0,8)} margin={{top:0,right:0,left:-10,bottom:40}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="name"
                  tick={{fontSize:11,fill:'#94a3b8'}}
                  axisLine={false} tickLine={false}
                  angle={-35} textAnchor="end" interval={0}
                  tickFormatter={(v:string) => v?.replace('Dr. ','Dr.').slice(0,12) || v}/>
                <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:12,border:'none',fontSize:12}}/>
                <Bar dataKey="appointmentCount" name="Appointments" fill="#0D7C66" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['#','Doctor','Specialization','Appointments','Avg. Rating','Revenue Est.'].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {doctors.map((doc, i) => {
                  const appts = doc.appointmentCount || doc.totalAppointments || 0;
                  const fee   = doc.consultationFee  || 50000; // paise, default ₹500
                  const revEst = appts * fee;
                  const pct   = Math.round((appts / maxAppts) * 100);
                  return (
                    <tr key={doc.id || i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          i === 0 ? 'bg-amber-100 text-amber-700' :
                          i === 1 ? 'bg-slate-200 text-slate-600' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-400'
                        }`}>{i + 1}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(doc.name || doc.firstName || 'D')[0]}{(doc.lastName || '')[0]}
                          </div>
                          <p className="font-semibold text-slate-900 text-sm">{doc.name || `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{doc.specialization || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5">
                            <div className="h-1.5 bg-[#0D7C66] rounded-full" style={{width:`${pct}%`}}/>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{appts}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {doc.avgRating ? (
                          <span className="text-sm font-semibold text-amber-600">⭐ {doc.avgRating.toFixed(1)}</span>
                        ) : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700 text-sm">{formatINR(revEst)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
