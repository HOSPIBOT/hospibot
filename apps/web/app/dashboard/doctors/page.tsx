'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Stethoscope, Clock, Users, Search } from 'lucide-react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const params: any = { limit: 50 };
        if (search) params.search = search;
        const [docRes, todayRes] = await Promise.all([
          api.get('/doctors', { params }),
          api.get('/appointments', { params: { limit: 200, from: new Date().toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) } }).catch(() => ({ data: { data: [] } })),
        ]);
        const apptCounts: Record<string,number> = {};
        (todayRes.data.data ?? []).forEach((a: any) => { if (a.doctorId) apptCounts[a.doctorId] = (apptCounts[a.doctorId]||0)+1; });
        setDoctors((docRes.data.data ?? []).map((d: any) => ({ ...d, todayAppointments: apptCounts[d.id] || 0 })));
      } catch { toast.error('Failed to load doctors'); }
      finally { setLoading(false); }
    };
    const timer = setTimeout(fetch, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
      </div>

      <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-2.5">
        <Search className="w-4 h-4 text-gray-400" />
        <input className="flex-1 text-sm outline-none" placeholder="Search by name or specialty..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading...</div>
        ) : doctors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">No doctors found</div>
        ) : (
          doctors.map(doc => (
            <div key={doc.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                  {doc.user?.firstName?.[0]}{doc.user?.lastName?.[0] || ''}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dr. {doc.user?.firstName} {doc.user?.lastName || ''}</p>
                  <p className="text-xs text-gray-500">{doc.department?.name || 'General'}</p>
                </div>
                <span className={`ml-auto badge ${doc.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                  {doc.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                {doc.specialties?.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {doc.specialties.map((s: string) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {doc.experience && <span>{doc.experience} yrs exp</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{doc.slotDuration} min slots</span>
                  {doc.consultationFee && <span>{formatINR(doc.consultationFee)}</span>}
                </div>
                {doc.qualifications && <p className="text-xs text-gray-400">{doc.qualifications}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
