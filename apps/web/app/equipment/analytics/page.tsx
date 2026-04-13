'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  RefreshCw, TrendingUp, Package, ShoppingCart, Wrench,
  ArrowUpRight, BarChart3, CheckCircle2, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLOR = '#1E40AF';
const PALETTE = [COLOR, '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

export default function EquipmentAnalyticsPage() {
  const [stats,       setStats]       = useState<any>(null);
  const [orderTrend,  setOrderTrend]  = useState<any[]>([]);
  const [statusDist,  setStatusDist]  = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [period,      setPeriod]      = useState<'week' | 'month' | 'quarter'>('month');
  const [loading,     setLoading]     = useState(true);

  const load = () => {
    setLoading(true);
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    Promise.all([
      api.get('/marketplace/stats').catch(() => ({ data: {} })),
      api.get('/analytics/revenue/trend', { params: { days } }).catch(() => ({ data: [] })),
      api.get('/marketplace/orders', { params: { limit: 50 } }).catch(() => ({ data: { data: [] } })),
      api.get('/marketplace/products', { params: { limit: 10, sort: 'sales' } }).catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, trendRes, ordersRes, productsRes]) => {
      setStats(statsRes.data ?? {});

      const raw = Array.isArray(trendRes.data) ? trendRes.data : (trendRes.data?.data ?? []);
      setOrderTrend(raw.slice(-12).map((d: any, i: number) => ({
        name  : d.month ?? d.date?.slice(5) ?? `W${i + 1}`,
        orders: d.count ?? d.orders ?? 0,
        revenue: d.revenue ?? d.total ?? 0,
      })));

      const orders: any[] = ordersRes.data?.data ?? [];
      const byStatus: Record<string, number> = {};
      orders.forEach((o: any) => { byStatus[o.status] = (byStatus[o.status] ?? 0) + 1; });
      setStatusDist(Object.entries(byStatus).map(([status, count]) => ({
        name: ORDER_STATUS_LABELS[status] ?? status, value: count,
      })));

      setTopProducts((productsRes.data?.data ?? []).slice(0, 5).map((p: any) => ({
        name : p.name ?? 'Product',
        sales: p.totalSold ?? p.orderCount ?? 0,
        revenue: p.revenue ?? 0,
      })));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [period]);

  const s = stats ?? {};

  const KPI_CARDS = [
    { label: 'Products Listed', value: s.totalProducts ?? '—',                icon: Package,      color: COLOR      },
    { label: 'Active B2B Orders',value: s.activeOrders ?? s.pendingOrders ?? '—', icon: ShoppingCart, color: '#8B5CF6' },
    { label: 'AMC Renewals (30d)',value: s.pendingServices ?? '—',             icon: Wrench,       color: '#F59E0B'  },
    { label: 'Month Revenue',    value: s.monthRevenue ? formatINR(s.monthRevenue) : '—', icon: TrendingUp, color: '#10B981' },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">B2B orders, catalogue performance & AMC tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['week', 'month', 'quarter'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${
                  period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>{p}</button>
            ))}
          </div>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />)}</div>
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Order trend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">B2B Order Trend</h3>
          {orderTrend.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              {loading ? 'Loading…' : 'No order data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={orderTrend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Bar dataKey="orders" fill={COLOR} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order status distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Order Status Breakdown</h3>
          {statusDist.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              {loading ? 'Loading…' : 'No orders yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                  {statusDist.map((_: any, i: number) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8}
                  formatter={(v: string) => <span className="text-xs text-slate-600">{v}</span>} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Top Products by Sales</h3>
            <a href="/equipment/products"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1">
              View catalogue <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {topProducts.map((p: any, i: number) => {
              const maxSales = topProducts[0]?.sales || 1;
              const pct = Math.round((p.sales / maxSales) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: `${COLOR}15`, color: COLOR }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                      <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{p.sales} sold</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: COLOR }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/equipment/orders',   label: 'B2B Orders',  icon: ShoppingCart, color: COLOR      },
          { href: '/equipment/products', label: 'Catalogue',   icon: Package,      color: '#8B5CF6'  },
          { href: '/equipment/dashboard',label: 'Dashboard',   icon: BarChart3,    color: '#10B981'  },
        ].map(l => (
          <a key={l.href} href={l.href}
            className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all group flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${l.color}15` }}>
              <l.icon className="w-4 h-4" style={{ color: l.color }} />
            </div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-800">{l.label}</p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto" />
          </a>
        ))}
      </div>
    </div>
  );
}
