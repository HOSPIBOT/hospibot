'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { TrendingUp, Users, Calendar, MessageSquare, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [appointmentStats, setAppointmentStats] = useState<any>(null);
  const [topDoctors, setTopDoctors] = useState<any[]>([]);
  const [demographics, setDemographics] = useState<any>(null);
  const [waStats, setWaStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dash, apts, docs, demo, wa] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/appointments?days=30'),
          api.get('/analytics/doctors/top?limit=5'),
          api.get('/analytics/patients/demographics'),
          api.get('/analytics/whatsapp?days=30'),
        ]);
        setDashboard(dash.data);
        setAppointmentStats(apts.data);
        setTopDoctors(docs.data);
        setDemographics(demo.data);
        setWaStats(wa.data);
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="card text-center">
            <TrendingUp className="w-5 h-5 text-primary-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{formatINR(dashboard.revenue.today)}</p>
            <p className="text-xs text-gray-500">Today's revenue</p>
            <p className={`text-xs mt-1 ${dashboard.revenue.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {dashboard.revenue.changePercent >= 0 ? '+' : ''}{dashboard.revenue.changePercent}% vs avg
            </p>
          </div>
          <div className="card text-center">
            <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{dashboard.appointments.today}</p>
            <p className="text-xs text-gray-500">Appointments today</p>
            <p className="text-xs text-red-500 mt-1">{dashboard.appointments.noShows} no-shows</p>
          </div>
          <div className="card text-center">
            <MessageSquare className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{dashboard.whatsapp.messagesToday}</p>
            <p className="text-xs text-gray-500">WhatsApp messages</p>
          </div>
          <div className="card text-center">
            <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{dashboard.patients.total}</p>
            <p className="text-xs text-gray-500">Total patients</p>
            <p className="text-xs text-emerald-500 mt-1">+{dashboard.patients.newThisMonth} this month</p>
          </div>
          <div className="card text-center">
            <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{dashboard.revenueEngine.conversionRate}%</p>
            <p className="text-xs text-gray-500">Automation conversion</p>
            <p className="text-xs text-gray-400 mt-1">{dashboard.revenueEngine.totalTriggered} triggered</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {appointmentStats && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Appointment metrics (30 days)</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-600">Total appointments</span><span className="font-medium">{appointmentStats.total}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Completion rate</span><span className="font-medium text-emerald-600">{appointmentStats.completionRate}%</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">No-show rate</span><span className="font-medium text-red-600">{appointmentStats.noShowRate}%</span></div>
              <hr className="border-gray-100" />
              <p className="text-xs font-medium text-gray-500 uppercase">By department</p>
              {(appointmentStats.byDepartment || []).slice(0, 5).map((d: any) => (
                <div key={d.department} className="flex justify-between">
                  <span className="text-sm text-gray-600">{d.department}</span>
                  <span className="text-sm font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Top doctors (this month)</h3>
          <div className="space-y-3">
            {topDoctors.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet</p>
            ) : (
              topDoctors.map((doc, i) => (
                <div key={doc.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{doc.completedThisMonth} visits</p>
                    <p className="text-xs text-gray-500">{formatINR(doc.estimatedRevenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {demographics && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Patient demographics</h3>
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Gender</p>
              {(demographics.gender || []).map((g: any) => (
                <div key={g.gender} className="flex justify-between">
                  <span className="text-sm text-gray-600">{g.gender}</span><span className="text-sm font-medium">{g.count}</span>
                </div>
              ))}
              <hr className="border-gray-100" />
              <p className="text-xs font-medium text-gray-500 uppercase">Age groups</p>
              {(demographics.ageGroups || []).map((a: any) => (
                <div key={a.range} className="flex justify-between">
                  <span className="text-sm text-gray-600">{a.range} years</span><span className="text-sm font-medium">{a.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {waStats && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">WhatsApp engagement (30 days)</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-600">Total conversations</span><span className="font-medium">{waStats.totalConversations}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Active conversations</span><span className="font-medium">{waStats.activeConversations}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Messages (inbound)</span><span className="font-medium">{waStats.inbound}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Messages (outbound)</span><span className="font-medium">{waStats.outbound}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Unread total</span><span className="font-medium text-red-500">{waStats.unreadTotal}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Avg msgs per conversation</span><span className="font-medium">{waStats.avgMessagesPerConversation}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
