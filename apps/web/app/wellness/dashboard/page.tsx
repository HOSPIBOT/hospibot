'use client';
import { useState } from 'react';
import { formatINR } from '@/lib/utils';
import { Users, Calendar, Package, TrendingUp, ArrowUpRight, Heart, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NAV_COLOR = '#BE185D';
const trend = Array.from({length:7},(_,i)=>({day:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],sessions:Math.floor(Math.random()*30+15)}));

export default function WellnessDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Wellness Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:'Active Members',value:'312',icon:Users,color:NAV_COLOR},
          {label:"Today's Sessions",value:'28',icon:Calendar,color:'#8B5CF6'},
          {label:'Renewals Due',value:'14',icon:Star,color:'#F59E0B'},
          {label:'Month Revenue',value:formatINR(15600000),icon:TrendingUp,color:'#10B981'},
        ].map(k=>(
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2"><k.icon className="w-4 h-4" style={{color:k.color}}/><p className="text-xs text-slate-500">{k.label}</p></div>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Weekly Sessions</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trend}>
            <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={NAV_COLOR} stopOpacity={0.2}/><stop offset="95%" stopColor={NAV_COLOR} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="day" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{borderRadius:12,border:'none',fontSize:12}}/>
            <Area type="monotone" dataKey="sessions" stroke={NAV_COLOR} strokeWidth={2.5} fill="url(#wg)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{href:'/wellness/members',label:'Members',icon:Users,color:NAV_COLOR},{href:'/wellness/bookings',label:'Sessions',icon:Calendar,color:'#8B5CF6'},{href:'/wellness/products',label:'Products',icon:Package,color:'#10B981'},{href:'/wellness/analytics',label:'Analytics',icon:Heart,color:'#F59E0B'}].map(l=>(
          <a key={l.href} href={l.href} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${l.color}15`}}><l.icon className="w-5 h-5" style={{color:l.color}}/></div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-[#BE185D] transition-colors">{l.label}</p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto"/>
          </a>
        ))}
      </div>
    </div>
  );
}
