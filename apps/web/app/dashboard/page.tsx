'use client';

import { useAuthStore } from '@/lib/store';
import { Calendar, Users, MessageSquare, TrendingUp } from 'lucide-react';

const kpiCards = [
  { label: "Today's Revenue", value: '₹4.2L', change: '+18%', icon: TrendingUp, color: 'from-primary-500 to-primary-400' },
  { label: 'Appointments Today', value: '47', change: '+8', icon: Calendar, color: 'from-blue-500 to-blue-400' },
  { label: 'WhatsApp Messages', value: '234', change: '12 pending', icon: MessageSquare, color: 'from-green-500 to-emerald-400' },
  { label: 'Follow-Up Rate', value: '76%', change: '+12%', icon: Users, color: 'from-purple-500 to-violet-400' },
];

export default function DashboardPage() {
  const { user, tenant } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.firstName}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {tenant?.name} &bull; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="card relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${kpi.color} opacity-10 rounded-bl-[50px] group-hover:opacity-20 transition-opacity`} />
            <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-emerald-600 text-sm font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> {kpi.change}
              </span>
              <span className="text-gray-400 text-xs">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Live patient queue</h3>
          <p className="text-gray-400 text-sm">Queue data will load from the appointments API</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue engine activity</h3>
          <p className="text-gray-400 text-sm">Automation metrics will load from the analytics API</p>
        </div>
      </div>
    </div>
  );
}
