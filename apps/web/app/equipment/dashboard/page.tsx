'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  Package, ShoppingCart, Wrench, TrendingUp, ArrowUpRight,
  BarChart3, Users, RefreshCw, Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NAV_COLOR = '#1E40AF';

export default function EquipmentDashboard() {
  const [stats,      setStats]      = useState<any>(null);
  const [orderTrend, setOrderTrend] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/marketplace/stats').catch(() => ({ data: {} })),
      api.get('/analytics/revenue/trend').catch(() => ({ data: [] })),
      api.get('/marketplace/orders', { params: { limit: 5 } }).catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, trendRes, ordersRes]) => {
      setStats(statsRes.data ?? {});
      const raw = Array.isArray(trendRes.data) ? trendRes.data : (trendRes.data?.data ?? []);
      setOrderTrend(raw.slice(-6).map((d: any, i: number) => ({
        name:   d.month ?? d.date?.slice(5, 7) ?? `M${i + 1}`,
        orders: d.count ?? d.orders ?? d.total ?? 0,
      })));
      setRecentOrders(ordersRes.data?.data ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const s = stats ?? {};
  const KPI_CARDS = [
    { label: 'Total Products', value: s.totalProducts ?? s.activeProducts ?? '—', icon: Package,      color: NAV_COLOR  },
    { label: 'Active Orders',  value: s.activeOrders  ?? s.pendingOrders  ?? '—', icon: ShoppingCart, color: '#8B5CF6'  },
    { label: 'AMC Due (30d)',  value: s.pendingServices ?? '—',                   icon: Wrench,       color: '#F59E0B'  },
    { label: 'Month Revenue',  value: s.monthRevenue ? formatINR(s.monthRevenue) : '—', icon: TrendingUp, color: '#10B981' },
  ];

  const ORDER_STATUS: Record<string, string> = {
    PENDING:    'bg-amber-100 text-amber-700',
    CONFIRMED:  'bg-blue-100 text-blue-700',
    SHIPPED:    'bg-purple-100 text-purple-700',
    DELIVERED:  'bg-emerald-100 text-emerald-700',
    CANCELLED:  'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Equipment Dashboard</h1>
        <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {KPI_CARDS.map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">B2B Orders — Last 6 Months</h3>
          {orderTrend.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              {loading ? 'Loading…' : 'No order data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={orderTrend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Bar dataKey="orders" fill={NAV_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Orders</h3>
            <a href="/equipment/orders" className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-12" />)}</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No orders yet</p>
            </div>
          ) : recentOrders.map((o: any) => (
            <div key={o.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${NAV_COLOR}15`, color: NAV_COLOR }}>
                #{o.orderNumber?.slice(-2) ?? o.id?.slice(-2) ?? '—'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {o.tenantName ?? o.buyerName ?? 'B2B Order'}
                </p>
                <p className="text-xs text-slate-400">
                  {o.totalAmount ? formatINR(o.totalAmount) : '—'} · {o.itemCount ?? 0} items
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ORDER_STATUS[o.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {o.status?.replace('_', ' ') ?? '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { href: '/equipment/products',  label: 'Catalogue',  icon: Package,      color: NAV_COLOR  },
          { href: '/equipment/orders',    label: 'B2B Orders', icon: ShoppingCart, color: '#8B5CF6'  },
          { href: '/equipment/whatsapp',  label: 'WhatsApp',   icon: Users,        color: '#25D366'  },
          { href: '/equipment/analytics', label: 'Analytics',  icon: BarChart3,    color: '#F59E0B'  },
        ].map(l => (
          <a key={l.href} href={l.href}
            className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${l.color}15` }}>
              <l.icon className="w-5 h-5" style={{ color: l.color }} />
            </div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-800 transition-colors">{l.label}</p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto" />
          </a>
        ))}
      </div>
    </div>
  );
}
