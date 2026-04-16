'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, Plus, Phone, Mail, Calendar, Tag, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', phone: '', email: '', gender: '', city: '' });

  const fetchPatients = useCallback(async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/patients', { params });
      setPatients(res.data?.data ?? res.data ?? []);
      setMeta(res.data.meta);
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchPatients(1, search); }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchPatients]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/patients', newPatient);
      toast.success('Patient added');
      setShowAdd(false);
      setNewPatient({ firstName: '', lastName: '', phone: '', email: '', gender: '', city: '' });
      fetchPatients();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to add patient'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total} total patients</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add patient
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddPatient} className="card space-y-3">
          <h3 className="font-semibold text-gray-900">New patient</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <input className="input-field" placeholder="First name *" value={newPatient.firstName} onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })} required />
            <input className="input-field" placeholder="Last name" value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} />
            <input className="input-field" placeholder="Phone *" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} required />
            <input className="input-field" placeholder="Email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} />
            <select className="input-field" value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
              <option value="">Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <input className="input-field" placeholder="City" value={newPatient.city} onChange={e => setNewPatient({ ...newPatient, city: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Save patient</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-outline text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5">
        <Search className="w-4 h-4 text-gray-400" />
        <input className="flex-1 text-sm outline-none" placeholder="Search by name, phone, email, or Health ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No patients found</div>
        ) : (
          patients.map((p: any) => (
            <div key={p.id} className="card flex items-center gap-4 cursor-pointer hover:border-primary-200">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {getInitials(p.firstName, p.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{p.firstName} {p.lastName || ''}</p>
                  {p.healthId && <span className="text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded font-mono">{p.healthId}</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
                  {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                  {p.gender && <span>{p.gender}</span>}
                  {p.lastVisitAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Last visit: {formatDate(p.lastVisitAt)}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {(p.tags || []).slice(0, 3).map((tag: string) => (
                  <span key={tag} className="badge badge-info flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{tag}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => fetchPatients(meta.page - 1, search)} disabled={meta.page <= 1} className="btn-outline text-sm flex items-center gap-1 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={() => fetchPatients(meta.page + 1, search)} disabled={meta.page >= meta.totalPages} className="btn-outline text-sm flex items-center gap-1 disabled:opacity-40">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
