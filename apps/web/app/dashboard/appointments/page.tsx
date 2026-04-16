'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Calendar, Clock, User, CheckCircle, XCircle, ArrowRight, Phone } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'badge-warning', CONFIRMED: 'badge-info', CHECKED_IN: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700', COMPLETED: 'badge-success', CANCELLED: 'badge-danger',
  NO_SHOW: 'bg-gray-100 text-gray-600', RESCHEDULED: 'bg-amber-100 text-amber-700',
};

const nextStatus: Record<string, { label: string; status: string }> = {
  CONFIRMED: { label: 'Check In', status: 'CHECKED_IN' },
  CHECKED_IN: { label: 'Start', status: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'Complete', status: 'COMPLETED' },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { date, limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const [aptsRes, statsRes] = await Promise.all([
        api.get('/appointments', { params }),
        api.get('/appointments/today/stats'),
      ]);
      setAppointments(aptsRes.data.data);
      setStats(statsRes.data);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, [date, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <input type="date" className="input-field w-auto" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, color: 'text-blue-600' },
            { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600' },
            { label: 'No Show', value: stats.noShow, color: 'text-gray-500' },
          ].map((s, i) => (
            <div key={i} className="card text-center py-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((s: any) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${statusFilter === s ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No appointments for this date</div>
        ) : (
          appointments.map((apt: any) => (
            <div key={apt.id} className="card flex items-center gap-4">
              <div className="text-center w-16 flex-shrink-0">
                <p className="text-lg font-bold text-gray-900">{formatTime(apt.scheduledAt)}</p>
                {apt.tokenNumber && <p className="text-[10px] text-primary-600 font-mono bg-primary-50 rounded px-1">{apt.tokenNumber}</p>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <p className="font-medium text-gray-900">{apt.patient?.firstName} {apt.patient?.lastName || ''}</p>
                  <span className={`badge ${statusColors[apt.status] || 'badge-info'}`}>{apt.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName || ''}</span>
                  {apt.department?.name && <span>{apt.department.name}</span>}
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{apt.duration} min</span>
                  <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{apt.patient?.phone}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {nextStatus[apt.status] && (
                  <button onClick={() => updateStatus(apt.id, nextStatus[apt.status].status)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                    {nextStatus[apt.status].label} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {['CONFIRMED', 'CHECKED_IN'].includes(apt.status) && (
                  <button onClick={() => updateStatus(apt.id, 'CANCELLED')}
                    className="text-xs text-red-500 hover:text-red-700 p-1.5" title="Cancel">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
