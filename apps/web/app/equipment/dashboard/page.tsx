'use client';
import { useState } from 'react';
import { formatINR } from '@/lib/utils';
import { Package, ShoppingCart, Wrench, TrendingUp, ArrowUpRight, BarChart3, Users, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NAV_COLOR = '#1E40AF';
const mockData = [{name:'Jan',orders:12},{name:'Feb',orders:18},{name:'Mar',orders:15},{name:'Apr',orders:22},{name:'May',orders:19},{name:'Jun',orders:25}];

export default function EquipmentDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Equipment Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:'Total Products',value:'48',icon:Package,color:NAV_COLOR},
          {label:'Active Orders',value:'7',icon:ShoppingCart,color:'#8B5CF6'},
          {label:'AMC Due (30d)',value:'3',icon:Wrench,color:'#F59E0B'},
          {label:'Month Revenue',value:formatINR(8900000),icon:TrendingUp,color:'#10B981'},
        ].map(k=>(
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2"><k.icon className="w-4 h-4" style={{color:k.color}}/><p className="text-xs text-slate-500">{k.label}</p></div>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">B2B Orders — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{borderRadius:12,border:'none',fontSize:12}}/>
            <Bar dataKey="orders" fill={NAV_COLOR} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{href:'/equipment/products',label:'Catalogue',icon:Package,color:NAV_COLOR},{href:'/equipment/orders',label:'B2B Orders',icon:ShoppingCart,color:'#8B5CF6'},{href:'/equipment/whatsapp',label:'WhatsApp',icon:Users,color:'#25D366'},{href:'/equipment/analytics',label:'Analytics',icon:BarChart3,color:'#F59E0B'}].map(l=>(
          <a key={l.href} href={l.href} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${l.color}15`}}><l.icon className="w-5 h-5" style={{color:l.color}}/></div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-[#1E40AF] transition-colors">{l.label}</p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto"/>
          </a>
        ))}
      </div>
    </div>
  );
}
