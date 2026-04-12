'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Home, Users, Calendar, Activity, ArrowUpRight, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NAV_COLOR = '#6B21A8';

export default function HomecareDashboard() {
  const [stats, setStats] = useState({ activePatients: 142, todayVisits: 18, pendingVisits: 5, staffDeployed: 12, monthRevenue: 34500000 });
  const trend = Array.from({length:14},(_,i)=>({ date: new Date(Date.now()-i*86400000).toISOString().split('T')[0].slice(5), visits: Math.floor(Math.random()*20+10) })).reverse();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Home Care Dashboard</h1>
      <div className="grid grid-cols-5 gap-4">
        {[
          { label:'Active Clients', value: stats.activePatients, icon: Users,        color: NAV_COLOR },
          { label:"Today's Visits", value: stats.todayVisits,    icon: Home,         color: '#3B82F6' },
          { label:'Pending Visits', value: stats.pendingVisits,  icon: Clock,        color: '#F59E0B' },
          { label:'Staff Deployed', value: stats.staffDeployed,  icon: Activity,     color: '#10B981' },
          { label:'Month Revenue',  value: formatINR(stats.monthRevenue), icon: TrendingUp, color: '#8B5CF6' },
        ].map(k=>(
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2"><k.icon className="w-4 h-4" style={{color:k.color}}/><p className="text-xs text-slate-500">{k.label}</p></div>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Daily Home Visits — Last 14 Days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trend}>
            <defs><linearGradient id="hcg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={NAV_COLOR} stopOpacity={0.2}/><stop offset="95%" stopColor={NAV_COLOR} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{borderRadius:12,border:'none',fontSize:12}}/>
            <Area type="monotone" dataKey="visits" stroke={NAV_COLOR} strokeWidth={2.5} fill="url(#hcg)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{href:'/homecare/bookings',label:'Bookings',icon:Calendar,color:NAV_COLOR},{href:'/homecare/staff',label:'Staff Dispatch',icon:Users,color:'#3B82F6'},{href:'/homecare/visits',label:'Home Visits',icon:Home,color:'#10B981'},{href:'/homecare/patients',label:'Clients',icon:Activity,color:'#F59E0B'}].map(l=>(
          <a key={l.href} href={l.href} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${l.color}15`}}><l.icon className="w-5 h-5" style={{color:l.color}}/></div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-[#6B21A8] transition-colors">{l.label}</p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto"/>
          </a>
        ))}
      </div>
    </div>
  );
}
