'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Users, Search, RefreshCw, Phone, MapPin, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomecareClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [deb, setDeb]         = useState('');
  const [meta, setMeta]       = useState({ page:1, total:0, totalPages:1 });

  useEffect(() => { const t = setTimeout(()=>setDeb(search), 350); return ()=>clearTimeout(t); }, [search]);

  const load = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (deb) params.search = deb;
      const r = await api.get('/patients', { params });
      setClients(r.data.data ?? []);
      setMeta(r.data.meta ?? { page:1, total:0, totalPages:1 });
    } catch {} finally { setLoading(false); }
  }, [deb]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-6 h-6 text-purple-600"/>Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total.toLocaleString('en-IN')} registered clients</p>
        </div>
        <button onClick={()=>load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
          <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
        </button>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
        <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search clients by name or phone…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-28"/>)}</div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm">No clients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {clients.map(c => (
            <a key={c.id} href={`/clinical/patients/${c.id}`}
              className="block bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-purple-200 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {c.firstName?.[0]}{c.lastName?.[0]||''}
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{c.firstName} {c.lastName||''}</p>
                  <p className="text-xs font-mono text-slate-400">{c.healthId}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                {c.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3"/>{c.phone}</div>}
                {(c.address||c.city) && <div className="flex items-center gap-1.5 truncate"><MapPin className="w-3 h-3"/>{c.address||c.city}</div>}
                {c.bloodGroup && <div className="flex items-center gap-1.5"><Heart className="w-3 h-3 text-red-400"/>{c.bloodGroup}{c.allergies?.length>0?` · ⚠ ${c.allergies[0]}`:''}</div>}
              </div>
            </a>
          ))}
        </div>
      )}

      {meta.totalPages>1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {meta.page}/{meta.totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={()=>load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
            <button onClick={()=>load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </div>
  );
}
