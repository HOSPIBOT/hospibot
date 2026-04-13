'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, CreditCard, Users, Activity,
  Megaphone, Settings, LogOut, ChevronRight, Shield,
  Bell, HelpCircle, Globe, MessageSquare, Code, Zap,
} from 'lucide-react';

const navSections = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/super-admin', label: 'Platform Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { href: '/super-admin/tenants', label: 'Hospitals & Clinics', icon: Building2 },
      { href: '/super-admin/portals',  label: 'Portal Families', icon: Globe },
      { href: '/super-admin/subtypes', label: 'Sub-Types',       icon: Layers },
      { href: '/super-admin/themes',   label: 'Themes',          icon: Palette },
      { href: '/super-admin/plans', label: 'Plans & Billing', icon: CreditCard },
      { href: '/super-admin/billing', label: 'Subscription Mgmt', icon: CreditCard },
      { href: '/super-admin/users', label: 'Platform Users', icon: Users },
      { href: '/super-admin/feature-flags', label: 'Feature Flags', icon: Zap },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { href: '/super-admin/system', label: 'System Health', icon: Activity },
      { href: '/super-admin/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/super-admin/templates', label: 'WA Templates', icon: MessageSquare },
      { href: '/super-admin/audit', label: 'Audit Log', icon: Activity },
    ],
  },
  {
    label: 'CONFIGURATION',
    items: [
      { href: '/super-admin/platform', label: 'Logo & Assets', icon: Globe },
      { href: '/super-admin/settings', label: 'Platform Settings', icon: Settings },
      { href: '/super-admin/api-docs', label: 'API Documentation', icon: Code },
    ],
  },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminName, setAdminName] = useState('Super Admin');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hospibot_access_token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('hospibot_user') : null;
    if (!token) {
      router.push('/auth/login');
      return;
    }
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'SUPER_ADMIN') {
          router.push('/dashboard');
          return;
        }
        setAdminName(`${user.firstName} ${user.lastName || ''}`.trim());
      } catch { /* ignore */ }
    }
  }, []);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    localStorage.removeItem('hospibot_super_token');
    localStorage.removeItem('hospibot_super_user');
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar — deep teal, authoritative */}
      <aside className="w-64 flex flex-col fixed h-full z-20" style={{ background: 'linear-gradient(180deg, #063A31 0%, #042B24 100%)' }}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D7C66] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white text-sm font-bold tracking-wide">HOSPIBOT</h1>
              <p className="text-[#4DB896] text-[10px] tracking-widest font-medium uppercase">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] text-white/30 font-semibold tracking-[0.15em] px-3 mb-1.5">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
                        active
                          ? 'bg-[#0D7C66] text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/8'
                      )}>
                        <item.icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-white/50 group-hover:text-white')} />
                        <span className="flex-1">{item.label}</span>
                        {active && <ChevronRight className="w-3 h-3 text-white/60" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-[#0D7C66] flex items-center justify-center text-white text-xs font-bold">SA</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{adminName}</p>
              <p className="text-white/40 text-[10px]">Platform Administrator</p>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Globe className="w-4 h-4" />
            <span className="font-medium text-slate-700">Platform Control Center</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">● All Systems Operational</span>
            <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page */}
        <div className="flex-1 p-6 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}
