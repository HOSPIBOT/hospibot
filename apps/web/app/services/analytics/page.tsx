'use client';
import { Users, CreditCard, BarChart3, Settings } from 'lucide-react';
const icons: Record<string, any> = { staff: Users, billing: CreditCard, analytics: BarChart3, settings: Settings };
const labels: Record<string, string> = { staff: 'Field Staff', billing: 'Services Billing', analytics: 'Analytics', settings: 'Settings' };
export default function Page() {
  const Icon = icons['analytics'];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">{labels['analytics']}</h1>
      <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
        <Icon className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
        <p className="text-slate-400 text-sm font-medium">{labels['analytics']}</p>
      </div>
    </div>
  );
}
