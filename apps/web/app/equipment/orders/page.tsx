'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ShoppingCart, RefreshCw, Package, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_COLORS: Record<string,string> = {
  PENDING:'bg-amber-100 text-amber-700', CONFIRMED:'bg-blue-100 text-blue-700',
  SHIPPED:'bg-purple-100 text-purple-700', DELIVERED:'bg-emerald-100 text-emerald-700',
  CANCELLED:'bg-red-100 text-red-700',
};

export default function EquipmentOrdersPage() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');
  const [meta, setMeta]       = useState({ page:1, total:0, totalPages:1 });

  const load = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filter) params.status = filter;
      const r = await api.get('/marketplace/orders', { params });
      setOrders(r.data.data ?? []);
      setMeta(r.data.meta ?? { page:1, total:0, totalPages:1 });
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(1); }, [load]);

  const advance = async (id: string, status: string) => {
    try {
      await api.patch(`/marketplace/orders/${id}`, { status });
      toast.success(`Order updated to ${status}`);
      load(meta.page);
    } catch { toast.error('Failed to update'); }
  };

  const NEXT_STATUS: Record<string,string> = { PENDING:'CONFIRMED', CONFIRMED:'SHIPPED', SHIPPED:'DELIVERED' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">B2B Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total} orders</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer"
            value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="">All Status</option>
            {['PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={()=>load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20"/>)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {['Order #','Buyer','Items','Amount','Date','Status',''].map(h=>(
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map(o=>{
                const items = (o.items as any[]) ?? [];
                const next = NEXT_STATUS[o.status];
                return (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{o.orderNumber||o.id?.slice(0,8).toUpperCase()}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 text-sm">{o.buyer?.name||o.tenantId?.slice(0,8)||'—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 max-w-48 truncate">
                      {items.slice(0,2).map((i:any)=>`${i.productName||i.name} x${i.quantity}`).join(', ')}
                      {items.length>2&&` +${items.length-2}`}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">{formatINR(o.totalAmount||0)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(o.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status]||'bg-slate-100 text-slate-600'}`}>{o.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {next&&<button onClick={()=>advance(o.id,next)}
                        className="text-[11px] font-bold text-[#1E40AF] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                        → {next}
                      </button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {meta.totalPages>1&&(
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{meta.total} total</p>
          <div className="flex items-center gap-1">
            <button onClick={()=>load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
            <span className="text-xs px-3">{meta.page}/{meta.totalPages}</span>
            <button onClick={()=>load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </div>
  );
}
