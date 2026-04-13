'use client';
import { useState } from 'react';
import { Users, Phone, Mail, Plus } from 'lucide-react';

const STAFF = [
  { id:'1', name:'Rahul Sharma',    role:'Service Engineer',   phone:'+91 98765 43210', email:'rahul@srv.com', status:'ACTIVE',    contracts:3 },
  { id:'2', name:'Priya Nair',      role:'Field Coordinator',  phone:'+91 98765 43211', email:'priya@srv.com', status:'ACTIVE',    contracts:2 },
  { id:'3', name:'Vijay Kumar',     role:'Technician',         phone:'+91 98765 43212', email:'vijay@srv.com', status:'ON_LEAVE',  contracts:1 },
  { id:'4', name:'Sunita Reddy',    role:'Account Manager',    phone:'+91 98765 43213', email:'sunita@srv.com',status:'ACTIVE',    contracts:4 },
];

export default function ServicesStaffPage() {
  const [staff] = useState(STAFF);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Field Staff</h1>
          <p className="text-sm text-slate-500 mt-0.5">{staff.filter(s => s.status === 'ACTIVE').length} active · {staff.length} total</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {staff.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                {s.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 truncate">{s.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>{s.status.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{s.role}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{s.phone}</div>
              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{s.email}</div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
              {s.contracts} contract{s.contracts !== 1 ? 's' : ''} assigned
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
