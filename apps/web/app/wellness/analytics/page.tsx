'use client';
import { useState } from 'react';
import { TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const weekRevenue = Array.from({length:7},(_,i)=>({day:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],revenue:Math.floor(Math.random()*50000+20000)}));
const monthAppt   = Array.from({length:4},(_,i)=>({week:`Week ${i+1}`,sessions:Math.floor(Math.random()*40+20)}));
export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Wellness Analytics</h1>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'This Month Revenue',v:'₹3,45,000',i:TrendingUp},{l:'Active Members',v:'48',i:Users},{l:'Sessions This Week',v:'28',i:Calendar},{l:'Satisfaction Score',v:'4.8/5',i:BarChart3}].map(k=>(
          <div key={k.l} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2"><k.i className="w-4 h-4" style={{color:'#BE185D'}}/><p className="text-xs text-slate-500">{k.l}</p></div>
            <p className="text-2xl font-bold text-slate-900">{k.v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Daily Revenue — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weekRevenue}>
              <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#BE185D" stopOpacity={0.15}/><stop offset="95%" stopColor="#BE185D" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="day" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:10,border:'none',fontSize:12}}/><Area type="monotone" dataKey="revenue" stroke="#BE185D" strokeWidth={2.5} fill="url(#ag)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Weekly Sessions</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthAppt}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="week" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:10,border:'none',fontSize:12}}/><Bar dataKey="sessions" fill="#BE185D" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
