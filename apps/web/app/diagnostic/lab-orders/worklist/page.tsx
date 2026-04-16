'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { FlaskConical, Clock, CheckCircle2, AlertTriangle, Filter, Loader2 } from 'lucide-react';

const NAVY = '#1E3A5F';
const DEPARTMENTS = ['All', 'Haematology', 'Biochemistry', 'Microbiology', 'Serology', 'Urine', 'Hormones', 'Other'];

function TatClock({ deadline }: { deadline: string | null }) {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff < 0) { setTxt('OVERDUE'); return; }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
      setTxt(`${h}h ${m}m`);
    };
    update(); const t = setInterval(update, 60000); return () => clearInterval(t);
  }, [deadline]);
  if (!txt) return null;
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${txt === 'OVERDUE' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>{txt}</span>;
}

export default function WorklistPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { status: 'RECEIVED_AT_LAB,IN_PROGRESS,RESULTED,VALIDATED', limit: 50 };
      if (department !== 'All') params.department = department;
      const res = await api.get('/diagnostic/orders/worklist', { params })
        .catch(() => api.get('/diagnostic/orders', { params }));
      setOrders(res.data?.data ?? res.data ?? []);
    } finally { setLoading(false); }
  }, [department]);

  useEffect(() => { load(); }, [load]);

  const pending = orders.filter((o: any) => ['RECEIVED_AT_LAB', 'IN_PROGRESS'].includes(o.status));
  const validation = orders.filter((o: any) => o.status === 'RESULTED');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lab Worklist</h1>
          <p className="text-sm text-slate-500">{pending.length} pending · {validation.length} awaiting validation</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {DEPARTMENTS.map((d: any) => (
          <button key={d} onClick={() => setDepartment(d)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${department === d ? 'text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            style={department === d ? { background: NAVY } : {}}>
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-bold text-slate-500 text-lg">Worklist Clear!</p>
          <p className="text-sm mt-1">No orders pending in the selected department</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Order', 'Patient', 'Tests', 'Status', 'TAT', 'Action'].map((h: any) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => {
                const p = o.patient ?? {};
                const items = o.orderItems ?? [];
                const deadline = items.map((i: any) => i.tatDeadline).filter(Boolean).sort()[0];
                return (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => router.push(`/diagnostic/lab-orders/${o.id}`)}>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-[#1E3A5F] font-mono text-sm">{o.orderNumber}</p>
                      {o.isStat && <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">STAT</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-slate-400">{p.gender} {p.dateOfBirth ? `· ${new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()}y` : ''}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {items.slice(0, 4).map((i: any) => (
                          <span key={i.id} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${['RESULTED','VALIDATED'].includes(i.status) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {i.testCode}
                          </span>
                        ))}
                        {items.length > 4 && <span className="text-[10px] text-slate-400">+{items.length - 4}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {o.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><TatClock deadline={deadline} /></td>
                    <td className="px-5 py-3.5">
                      <button onClick={e => { e.stopPropagation(); router.push(`/diagnostic/results?orderId=${o.id}`); }}
                        className="text-xs font-bold text-white px-3 py-1.5 rounded-lg hover:opacity-90" style={{ background: NAVY }}>
                        Enter Results
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
