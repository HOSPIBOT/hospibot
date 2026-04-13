'use client';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { ShoppingCart, Package, Clock, CheckCircle2 } from 'lucide-react';
const STATUS_COLORS: Record<string,string> = { PENDING:'bg-amber-100 text-amber-700', CONFIRMED:'bg-blue-100 text-blue-700', SHIPPED:'bg-purple-100 text-purple-700', DELIVERED:'bg-emerald-100 text-emerald-700', CANCELLED:'bg-red-100 text-red-700' };
const ORDERS = [
  { id:'1', orderNo:'EQ-2024-0091', buyer:'City Multi-Speciality Hospital', items:'Hospital Bed x5, Oxygen Concentrator x2', amount:'₹10,25,000', status:'CONFIRMED', date:new Date().toISOString() },
  { id:'2', orderNo:'EQ-2024-0090', buyer:'Sunrise Nursing Home',          items:'Digital Monitor x3, Infusion Pump x10', amount:'₹6,52,500',  status:'SHIPPED',   date:new Date(Date.now()-86400000*2).toISOString() },
  { id:'3', orderNo:'EQ-2024-0089', buyer:'Apollo Diagnostics',            items:'ECG Machine x2',                        amount:'₹1,30,000',  status:'DELIVERED', date:new Date(Date.now()-86400000*5).toISOString() },
  { id:'4', orderNo:'EQ-2024-0088', buyer:'MedCare Clinic',                items:'Wheelchair x6, Pulse Oximeter x20',     amount:'₹1,07,000',  status:'PENDING',   date:new Date(Date.now()-86400000*1).toISOString() },
];
export default function EquipmentOrdersPage() {
  const [filter, setFilter] = useState('');
  const filtered = ORDERS.filter(o=>!filter||o.status===filter);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">B2B Orders</h1>
        <select className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="">All Orders</option>{['PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED'].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'Total Orders',v:ORDERS.length,c:'#1E40AF'},{l:'Pending',v:ORDERS.filter(o=>o.status==='PENDING').length,c:'#F59E0B'},{l:'In Transit',v:ORDERS.filter(o=>o.status==='SHIPPED').length,c:'#8B5CF6'},{l:'Delivered',v:ORDERS.filter(o=>o.status==='DELIVERED').length,c:'#10B981'}].map(s=>(
          <div key={s.l} className="bg-white rounded-2xl border border-slate-100 p-4"><p className="text-xs text-slate-500 mb-1">{s.l}</p><p className="text-2xl font-bold" style={{color:s.c}}>{s.v}</p></div>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(o=>(
          <div key={o.id} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-slate-900 font-mono text-sm">{o.orderNo}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{o.buyer}</p>
                <p className="text-xs text-slate-400 mt-0.5">{o.items}</p>
              </div>
              <div className="text-right">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{o.amount}</p>
                <p className="text-xs text-slate-400">{formatDate(o.date)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
