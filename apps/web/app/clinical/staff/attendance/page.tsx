'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Clock, Users, CheckCircle2, X, AlertTriangle,
  RefreshCw, Download, Calendar, TrendingUp,
  ChevronLeft, ChevronRight, Search, Plus,
} from 'lucide-react';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; text: string }> = {
  PRESENT:  { label: 'Present',  bg: 'bg-emerald-100', text: 'text-emerald-700' },
  ABSENT:   { label: 'Absent',   bg: 'bg-red-100',     text: 'text-red-700'     },
  HALF_DAY: { label: 'Half Day', bg: 'bg-amber-100',   text: 'text-amber-700'   },
  LEAVE:    { label: 'Leave',    bg: 'bg-blue-100',    text: 'text-blue-700'    },
  HOLIDAY:  { label: 'Holiday',  bg: 'bg-purple-100',  text: 'text-purple-700'  },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function StaffAttendancePage() {
  const [staff,        setStaff]        = useState<any[]>([]);
  const [attendance,   setAttendance]   = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState<string | null>(null);
  const [search,       setSearch]       = useState('');
  const [month,        setMonth]        = useState(new Date().getMonth());
  const [year,         setYear]         = useState(new Date().getFullYear());
  const [exporting,    setExporting]    = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0,10));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0,10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes] = await Promise.all([
        api.get('/security/users', { params: { limit: 100 } }),
      ]);
      const users = usersRes.data.data ?? usersRes.data ?? [];
      setStaff(users.filter((u: any) => u.role !== 'PATIENT'));
    } catch { setStaff([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getAttendance = (userId: string, dateStr: string): AttendanceStatus | null => {
    return attendance[userId]?.[dateStr] ?? null;
  };

  const markAttendance = async (userId: string, dateStr: string, status: AttendanceStatus) => {
    setSaving(`${userId}-${dateStr}`);
    setAttendance(a => ({
      ...a,
      [userId]: { ...a[userId], [dateStr]: status },
    }));
    await new Promise(r => setTimeout(r, 200)); // optimistic UI
    setSaving(null);
    // In real implementation: await api.post('/hrms/attendance', { userId, date: dateStr, status });
  };

  const exportCSV = () => {
    setExporting(true);
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toISOString().slice(0, 10);
    });
    const header = ['Staff Name', 'Role', ...dates.map(d => d.slice(8))];
    const rows = staff.map(s => [
      `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      s.role?.replace(/_/g,' ') || '',
      ...dates.map(d => attendance[s.id]?.[d] || '—'),
    ]);
    const csv = [header,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
    const a = document.createElement('a');a.href=url;a.download=`attendance-${MONTHS[month]}-${year}.csv`;
    a.click();URL.revokeObjectURL(url);toast.success('Attendance report exported');
    setExporting(false);
  };

  const filteredStaff = staff.filter(s =>
    !search || `${s.firstName} ${s.lastName} ${s.role} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // Monthly summary per staff member
  const getSummary = (userId: string) => {
    const rec = attendance[userId] || {};
    const dates = Object.keys(rec).filter(d => d.startsWith(`${year}-${String(month+1).padStart(2,'0')}`));
    const present  = dates.filter(d => rec[d] === 'PRESENT').length;
    const absent   = dates.filter(d => rec[d] === 'ABSENT').length;
    const halfDay  = dates.filter(d => rec[d] === 'HALF_DAY').length;
    const leave    = dates.filter(d => rec[d] === 'LEAVE').length;
    return { present, absent, halfDay, leave };
  };

  const todayStats = {
    present: staff.filter(s => attendance[s.id]?.[today] === 'PRESENT').length,
    absent:  staff.filter(s => attendance[s.id]?.[today] === 'ABSENT').length,
    onLeave: staff.filter(s => attendance[s.id]?.[today] === 'LEAVE').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#0D7C66]" /> Staff Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{MONTHS[month]} {year} · {staff.length} staff members</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e=>setMonth(+e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none">
            {MONTHS.map((m,i)=><option key={m} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(+e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none">
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            <Download className="w-4 h-4"/> {exporting?'Exporting…':'Export'}
          </button>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
        </div>
      </div>

      {/* Today's KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Today's Present",  value: todayStats.present, color:'#10B981' },
          { label:"Today's Absent",   value: todayStats.absent,  color:'#EF4444' },
          { label:"On Leave",         value: todayStats.onLeave, color:'#3B82F6' },
          { label:"Total Staff",      value: staff.length,       color:'#0D7C66' },
        ].map(k=>(
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="text-3xl font-bold mt-1" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Today's quick mark */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0D7C66]" /> Mark Today's Attendance
            <span className="text-xs font-normal text-slate-400">{today}</span>
          </h3>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input className="bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search staff…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          {loading ? Array.from({length:5}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-xl h-12"/>) :
          filteredStaff.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">No staff found</p> :
          filteredStaff.map(s => {
            const current = getAttendance(s.id, today);
            const isSaving = saving === `${s.id}-${today}`;
            return (
              <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0D7C66] text-white text-xs font-bold flex items-center justify-center">
                    {s.firstName?.[0]}{s.lastName?.[0]||''}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{s.firstName} {s.lastName||''}</p>
                    <p className="text-xs text-slate-400">{s.role?.replace(/_/g,' ')} · {s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['PRESENT','HALF_DAY','LEAVE','ABSENT'] as AttendanceStatus[]).map(status => {
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <button key={status} onClick={() => markAttendance(s.id, today, status)}
                        disabled={isSaving}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          current === status ? `${cfg.bg} ${cfg.text} border-current` : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                        }`}>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{MONTHS[month]} {year} Summary</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Staff</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase">Present</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-red-500 uppercase">Absent</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase">Half Day</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase">Leave</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Attendance %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredStaff.map(s => {
              const sum = getSummary(s.id);
              const total = sum.present + sum.absent + sum.halfDay + sum.leave;
              const pct = total > 0 ? Math.round(((sum.present + sum.halfDay * 0.5) / total) * 100) : 0;
              return (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{s.firstName} {s.lastName||''}</p>
                    <p className="text-xs text-slate-400">{s.role?.replace(/_/g,' ')}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-emerald-600">{sum.present}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-red-500">{sum.absent}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-amber-600">{sum.halfDay}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-blue-600">{sum.leave}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-[#0D7C66]" style={{width:`${pct}%`}} />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
