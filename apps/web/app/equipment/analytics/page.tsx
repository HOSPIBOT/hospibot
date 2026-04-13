'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { RefreshCw, TrendingUp, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PORTAL_COLOR = '#1E40AF';

export default function PortalAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard').catch(() => ({ data: {} })),
      api.get('/analytics/revenue/trend?days=30').catch(() => ({ data: [] })),
    ]).then(([s, t]) => {
      setStats(s.data);
      setTrend(Array.isArray(t.data) ? t.data : []);
    }).finally(() => setLoading(false));
  }, []);

  const d = stats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <button onClick={() => location.reload()} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
          <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[
            { l:'Monthly Revenue', v: formatINR(d.monthRevenue??0), icon: TrendingUp },
            { l:'Active Records',  v: d.totalPatients??0,            icon: Package },
            { l:'This Week',       v: d.weekAppointments??0,         icon: ShoppingCart },
            { l:'Completion Rate', v: d.completionRate ? `${d.completionRate}%` : '—', icon: BarChart3 },
          ].map(k => (
            <div key={k.l} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <k.icon className="w-4 h-4" style={{color:PORTAL_COLOR}}/>
                <p className="text-xs text-slate-500">{k.l}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend (30 days)</h3>
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{top:0,right:0,left:-10,bottom:0}}>
              <defs>
                <linearGradient id="portalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PORTAL_COLOR} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={PORTAL_COLOR} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                tickFormatter={(v:string)=>v?.slice(5)||v}/>
              <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                tickFormatter={(v:number)=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v:any)=>[formatINR(Number(v)),'Revenue']}
                contentStyle={{borderRadius:12,border:'none',fontSize:12}}/>
              <Area type="monotone" dataKey="revenue" stroke={PORTAL_COLOR} strokeWidth={2.5} fill="url(#portalGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No revenue data yet</div>
        )}
      </div>
    </div>
  );
}
