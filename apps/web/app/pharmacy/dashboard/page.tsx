'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Pill, AlertTriangle, Package, TrendingUp, Clock, ShoppingCart, ArrowUpRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NAV_COLOR = '#166534';

export default function PharmacyDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/pharmacy/dashboard').catch(() => ({ data: {} })),
      api.get('/pharmacy/revenue-trend?days=14').catch(() => ({ data: [] })),
    ]).then(([s, t]) => {
      setStats(s.data);
      setTrend(Array.isArray(t.data) ? t.data : []);
    }).finally(() => setLoading(false));
  }, []);

  const kpis = stats ? [
    { label: 'Total Products',  value: stats.totalProducts,                       icon: Pill,          color: NAV_COLOR },
    { label: 'Low Stock',       value: stats.lowStockCount,                        icon: AlertTriangle, color: '#F59E0B' },
    { label: 'Near Expiry',     value: stats.expiringCount,                        icon: Clock,         color: '#EF4444' },
    { label: 'Out of Stock',    value: stats.outOfStockCount,                      icon: Package,       color: '#DC2626' },
    { label: "Today's Sales",   value: stats.todayOrders,                          icon: ShoppingCart,  color: '#3B82F6' },
    { label: "Today's Revenue", value: formatINR(stats.todayRevenue),              icon: TrendingUp,    color: '#8B5CF6' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Inventory & dispensing overview</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
          {kpis.map((k: any) => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <div className="w-9 h-9 rounded-xl mx-auto flex items-center justify-center mb-2" style={{ background: `${k.color}15` }}>
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              <p className="text-xl font-bold text-slate-900">{k.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {stats && (stats.lowStockCount > 0 || stats.expiringCount > 0 || stats.outOfStockCount > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {stats.outOfStockCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Package className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-800">{stats.outOfStockCount} Out of Stock</p>
                <p className="text-xs text-red-600">Requires immediate restocking</p>
              </div>
              <a href="/pharmacy/inventory" className="ml-auto text-red-600 hover:text-red-800"><ArrowUpRight className="w-4 h-4" /></a>
            </div>
          )}
          {stats.lowStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-800">{stats.lowStockCount} Low Stock</p>
                <p className="text-xs text-amber-600">Below minimum level</p>
              </div>
              <a href="/pharmacy/inventory" className="ml-auto text-amber-600 hover:text-amber-800"><ArrowUpRight className="w-4 h-4" /></a>
            </div>
          )}
          {stats.expiringCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-bold text-orange-800">{stats.expiringCount} Near Expiry</p>
                <p className="text-xs text-orange-600">Expiring within 90 days</p>
              </div>
              <a href="/pharmacy/inventory" className="ml-auto text-orange-600 hover:text-orange-800"><ArrowUpRight className="w-4 h-4" /></a>
            </div>
          )}
        </div>
      )}

      {/* Revenue trend */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Revenue — Last 14 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={NAV_COLOR} stopOpacity={0.2} />
                <stop offset="95%" stopColor={NAV_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => `₹${(v/100000).toFixed(0)}L`} />
            <Tooltip formatter={(v: any) => [formatINR(v), 'Revenue']}
              contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke={NAV_COLOR} strokeWidth={2.5} fill="url(#pg)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { href: '/pharmacy/products',       label: 'Products',        icon: Pill,          color: NAV_COLOR },
          { href: '/pharmacy/inventory',      label: 'Inventory',       icon: Package,       color: '#3B82F6' },
          { href: '/pharmacy/orders',         label: 'Dispensing',      icon: ShoppingCart,  color: '#8B5CF6' },
          { href: '/pharmacy/purchase-orders',label: 'Purchase Orders', icon: TrendingUp,    color: '#F59E0B' },
        ].map((link: any) => (
          <a key={link.href} href={link.href}
            className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${link.color}15` }}>
              <link.icon className="w-5 h-5" style={{ color: link.color }} />
            </div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-[#166534] transition-colors">{link.label}</p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto" />
          </a>
        ))}
      </div>
    </div>
  );
}
