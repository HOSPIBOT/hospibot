'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Star, TrendingUp, RefreshCw, Download, MessageSquare,
  ThumbsUp, ThumbsDown, Minus, ChevronLeft, ChevronRight,
  BarChart3, Users, Smile,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export default function NPSDashboard() {
  const [reviews, setReviews]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page,    setPage]      = useState(1);
  const [meta,    setMeta]      = useState({ total:0, totalPages:1 });
  const [exporting, setExporting] = useState(false);
  const perPage = 15;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      // Fetch feedback/reviews from visits
      const res = await api.get('/analytics/dashboard');
      const dash = res.data ?? {};
      // Also fetch recent CRM leads for NPS score calculation
      const visitRes = await api.get('/visits', {
        params: { limit: 100, hasFeedback: true }
      }).catch(() => ({ data: { data: [] } }));
      setReviews(visitRes.data?.data ?? []);
      setMeta({ total: visitRes.data?.meta?.total ?? 0, totalPages: Math.ceil((visitRes.data?.meta?.total ?? 0) / perPage) });
    } catch { setReviews([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Compute NPS
  const ratingsData = reviews.filter(r => r.rating);
  const avg = ratingsData.length > 0
    ? (ratingsData.reduce((s, r) => s + (r.rating || 0), 0) / ratingsData.length).toFixed(1)
    : '—';

  const promoters  = ratingsData.filter(r => r.rating >= 4).length;
  const detractors = ratingsData.filter(r => r.rating <= 2).length;
  const passives   = ratingsData.filter(r => r.rating === 3).length;
  const nps = ratingsData.length > 0
    ? Math.round(((promoters - detractors) / ratingsData.length) * 100)
    : 0;

  const pieData = [
    { name: 'Promoters (4-5⭐)', value: promoters  },
    { name: 'Passives (3⭐)',     value: passives   },
    { name: 'Detractors (1-2⭐)', value: detractors },
  ];

  const exportCSV = () => {
    setExporting(true);
    const header = ['Date', 'Patient', 'Rating', 'Feedback', 'Doctor'];
    const rows = reviews.map(r => [
      formatDate(r.createdAt),
      `${r.patient?.firstName||''} ${r.patient?.lastName||''}`.trim(),
      r.rating || '—',
      r.feedback || r.notes || '—',
      r.doctor ? `Dr. ${r.doctor.user?.firstName||''} ${r.doctor.user?.lastName||''}`.trim() : '—',
    ]);
    const csv = [header,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`feedback-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();URL.revokeObjectURL(url);toast.success('Feedback exported');
    setExporting(false);
  };

  const npsColor = nps >= 50 ? '#10B981' : nps >= 0 ? '#F59E0B' : '#EF4444';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" /> Patient Feedback & NPS
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Net Promoter Score and satisfaction analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            <Download className="w-4 h-4"/> {exporting?'Exporting…':'Export'}
          </button>
          <button onClick={()=>load()} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
        </div>
      </div>

      {/* NPS Score + KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-1 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">NPS Score</p>
          <p className="text-6xl font-black" style={{color:npsColor}}>{nps}</p>
          <p className="text-xs text-slate-400 mt-2">
            {nps >= 50 ? '🟢 Excellent' : nps >= 30 ? '🟡 Good' : nps >= 0 ? '🟠 Needs Work' : '🔴 At Risk'}
          </p>
        </div>
        {[
          { label: 'Avg Rating',    value: avg,           icon: Star,      color: '#F59E0B', suffix: '/ 5' },
          { label: 'Promoters',     value: promoters,     icon: ThumbsUp,  color: '#10B981', suffix: '' },
          { label: 'Passives',      value: passives,      icon: Minus,     color: '#6B7280', suffix: '' },
          { label: 'Detractors',    value: detractors,    icon: ThumbsDown,color: '#EF4444', suffix: '' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium">{k.label}</p>
              <k.icon className="w-4 h-4" style={{color:k.color}} />
            </div>
            <p className="text-3xl font-bold" style={{color:k.color}}>{k.value}<span className="text-sm font-normal text-slate-400 ml-1">{k.suffix}</span></p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Rating Distribution</h3>
          {reviews.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[1,2,3,4,5].map(s => ({
                star: `${s}⭐`,
                count: ratingsData.filter(r=>r.rating===s).length,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="star" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-300">
              <Star className="w-12 h-12" />
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Promoters vs Detractors</h3>
          {reviews.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData.filter(d=>d.value>0)} cx="50%" cy="50%"
                  outerRadius={80} dataKey="value" label={({name,percent})=>`${name.split(' ')[0]} ${Math.round(percent*100)}%`}>
                  {pieData.map((_,i) => <Cell key={i} fill={COLORS[i]}/>)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-300">
              <BarChart3 className="w-12 h-12" />
            </div>
          )}
        </div>
      </div>

      {/* Recent reviews */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Recent Feedback</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-xl h-14"/>)}</div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center">
            <Smile className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No feedback collected yet</p>
            <p className="text-slate-400 text-xs mt-1">Feedback is collected via WhatsApp after each visit</p>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              {['Date','Patient','Rating','Doctor','Feedback'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {reviews.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{r.patient?.firstName} {r.patient?.lastName||''}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s=>(
                        <Star key={s} className={`w-3.5 h-3.5 ${s<=(r.rating||0)?'text-amber-400 fill-amber-400':'text-slate-200 fill-slate-200'}`}/>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.doctor?`Dr. ${r.doctor.user?.firstName||''} ${r.doctor.user?.lastName||''}`:' —'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{r.feedback||r.clinicalNotes||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>{meta.total} total reviews</span>
            <div className="flex gap-1.5">
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="p-1.5 rounded-xl border border-slate-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)} className="p-1.5 rounded-xl border border-slate-200 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
