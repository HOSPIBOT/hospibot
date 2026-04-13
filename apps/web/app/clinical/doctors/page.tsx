'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Stethoscope, Plus, Search, RefreshCw, X, Loader2, Clock,
  CheckCircle2, XCircle, Edit3, Phone, Mail, Award, Calendar, Download,
} from 'lucide-react';

const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopaedics', 'Gynaecology',
  'Paediatrics', 'Dermatology', 'ENT', 'Ophthalmology', 'Dentistry', 'Psychiatry',
  'Oncology', 'Urology', 'Nephrology', 'Gastroenterology', 'Pulmonology',
  'Endocrinology', 'Radiology', 'Pathology', 'Anaesthesiology', 'Physiotherapy',
];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function DoctorCard({ doc, onToggle }: { doc: any; onToggle: (id: string, available: boolean) => void }) {
  const [toggling, setToggling] = useState(false);

  const toggle = async () => {
    setToggling(true);
    try {
      await api.patch(`/doctors/${doc.id}`, { isAvailable: !doc.isAvailable });
      onToggle(doc.id, !doc.isAvailable);
      toast.success(`Dr. ${doc.user?.firstName} marked as ${!doc.isAvailable ? 'Available' : 'Unavailable'}`);
    } catch { toast.error('Failed to update status'); }
    finally { setToggling(false); }
  };

  const schedule = doc.settings?.schedule || {};

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-lg font-bold flex-shrink-0">
          {doc.user?.firstName?.[0]}{doc.user?.lastName?.[0] || ''}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-slate-900">Dr. {doc.user?.firstName} {doc.user?.lastName || ''}</p>
              <p className="text-xs text-slate-500 mt-0.5">{doc.department?.name || 'General'}</p>
            </div>
            <button onClick={toggle} disabled={toggling}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${doc.isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
              {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> :
               doc.isAvailable ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {doc.isAvailable ? 'Available' : 'Unavailable'}
            </button>
            <a href={`/clinical/doctors/${doc.id}`}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
              Profile →
            </a>
          </div>
        </div>
      </div>

      {/* Specialties */}
      {doc.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {doc.specialties.map((s: string) => (
            <span key={s} className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Experience', value: doc.experience ? `${doc.experience} yrs` : '—', icon: Award },
          { label: 'Slot Duration', value: `${doc.slotDuration || 15} min`, icon: Clock },
          { label: 'Consult Fee', value: doc.consultationFee ? formatINR(doc.consultationFee) : '—', icon: Calendar },
        ].map(s => (
          <div key={s.label} className="text-center bg-slate-50 rounded-xl py-2">
            <p className="text-sm font-bold text-slate-900">{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="space-y-1.5 border-t border-slate-100 pt-3">
        {doc.user?.phone && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone className="w-3 h-3" /> {doc.user.phone}
          </div>
        )}
        {doc.user?.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-3 h-3" /> {doc.user.email}
          </div>
        )}
        {doc.registrationNo && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Award className="w-3 h-3" /> Reg: {doc.registrationNo}
          </div>
        )}
      </div>

      {/* Qualification */}
      {doc.qualifications && (
        <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">{doc.qualifications}</p>
      )}
    </div>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors]   = useState<any[]>([]);
  const [depts, setDepts]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '',
    registrationNo: '', qualifications: '', specialties: [] as string[],
    experience: '', consultationFee: '', slotDuration: '15',
    departmentId: '', bio: '', isAvailable: true,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (debSearch) params.search = debSearch;
      const [docRes, deptRes] = await Promise.all([
        api.get('/doctors', { params }),
        api.get('/doctors/departments', { params: { limit: 100 } }).then(r => ({ data: { data: r.data } })).catch(() => ({ data: { data: [] } })),
      ]);
      setDoctors(docRes.data.data ?? []);
      setDepts(deptRes.data.data ?? []);
    } catch { toast.error('Failed to load doctors'); }
    finally { setLoading(false); }
  }, [debSearch]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const header = ['Name', 'Specialties', 'Phone', 'Email', 'Reg. No.', 'Available', 'Departments'];
    const rows = doctors.map(d => [
      `Dr. ${d.user?.firstName ?? ''} ${d.user?.lastName ?? ''}`.trim(),
      (d.specialties as string[])?.join('; ') ?? '',
      d.user?.phone ?? '',
      d.user?.email ?? '',
      d.registrationNumber ?? '',
      d.isAvailable ? 'Yes' : 'No',
      (d.departments as any[])?.map((dep: any) => dep.name).join('; ') ?? '',
    ]);
    const csv  = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `doctors-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${doctors.length} doctors`);
  };
    setDoctors(d => d.map(doc => doc.id === id ? { ...doc, isAvailable: available } : doc));
  };

  const toggleSpecialty = (spec: string) => {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(spec)
        ? f.specialties.filter(s => s !== spec)
        : [...f.specialties, spec],
    }));
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async () => {
    if (!form.firstName || !form.email || !form.password) {
      toast.error('Name, email and password are required');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create user account for doctor
      const userRes = await api.post('/auth/users', {
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        phone: form.phone, role: 'DOCTOR',
      });

      // 2. Create doctor profile
      await api.post('/doctors', {
        userId: userRes.data.id,
        registrationNo: form.registrationNo,
        qualifications: form.qualifications,
        specialties: form.specialties,
        experience: form.experience ? Number(form.experience) : undefined,
        consultationFee: form.consultationFee ? Math.round(Number(form.consultationFee) * 100) : undefined,
        slotDuration: Number(form.slotDuration),
        departmentId: form.departmentId || undefined,
        bio: form.bio,
        isAvailable: true,
      });

      toast.success(`Dr. ${form.firstName} added successfully!`);
      setShowAdd(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', registrationNo: '', qualifications: '', specialties: [], experience: '', consultationFee: '', slotDuration: '15', departmentId: '', bio: '', isAvailable: true });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add doctor');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-sm text-slate-500 mt-0.5">{doctors.length} doctors in your facility</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} disabled={loading || doctors.length === 0}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search by name or specialty…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Doctors', value: doctors.length, color: '#0D7C66' },
          { label: 'Available Now', value: doctors.filter(d => d.isAvailable).length, color: '#10B981' },
          { label: 'Unavailable', value: doctors.filter(d => !d.isAvailable).length, color: '#94A3B8' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Doctors grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-52" />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Stethoscope className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No doctors found</p>
          <p className="text-slate-300 text-xs mt-1">Add your first doctor to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(doc => (
            <DoctorCard key={doc.id} doc={doc} onToggle={toggleAvailability} />
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">Add Doctor</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Personal */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Personal Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">First Name <span className="text-red-500">*</span></label>
                    <input className={inputCls} placeholder="Priya" value={form.firstName} onChange={setF('firstName')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Last Name</label>
                    <input className={inputCls} placeholder="Sharma" value={form.lastName} onChange={setF('lastName')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
                    <input className={inputCls} type="email" placeholder="dr.priya@hospital.com" value={form.email} onChange={setF('email')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone</label>
                    <input className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={setF('phone')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Login Password <span className="text-red-500">*</span></label>
                    <input className={inputCls} type="password" placeholder="Min 8 characters" value={form.password} onChange={setF('password')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Department</label>
                    <select className={inputCls} value={form.departmentId} onChange={setF('departmentId')}>
                      <option value="">No Department</option>
                      {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Professional Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Registration No.</label>
                    <input className={inputCls} placeholder="MCI/NMC number" value={form.registrationNo} onChange={setF('registrationNo')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Experience (years)</label>
                    <input className={inputCls} type="number" min={0} placeholder="10" value={form.experience} onChange={setF('experience')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Consultation Fee (₹)</label>
                    <input className={inputCls} type="number" min={0} placeholder="500" value={form.consultationFee} onChange={setF('consultationFee')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Slot Duration (min)</label>
                    <select className={inputCls} value={form.slotDuration} onChange={setF('slotDuration')}>
                      {[10, 15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Qualifications</label>
                    <input className={inputCls} placeholder="MBBS, MD (Cardiology), DM" value={form.qualifications} onChange={setF('qualifications')} />
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map(spec => (
                    <button key={spec} onClick={() => toggleSpecialty(spec)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${form.specialties.includes(spec) ? 'bg-[#0D7C66] text-white border-[#0D7C66]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#0D7C66] hover:text-[#0D7C66]'}`}>
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Bio / About</label>
                <textarea className={`${inputCls} resize-none`} rows={3}
                  placeholder="Brief professional description…"
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowAdd(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
              <button onClick={handleAdd} disabled={submitting}
                className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Adding Doctor…' : 'Add Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
