'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { FALLBACK_THEMES, getPlatformAssets, type PortalTheme, type PlatformAssets } from '@/lib/portal/portal-types';
import {
  LayoutDashboard, MessageSquare, Calendar, Users, CreditCard,
  Stethoscope, BarChart3, Zap, Settings, LogOut, Bell, Search,
  FlaskConical, Package, ShoppingCart, Home, Truck, Heart,
  Briefcase, ClipboardList, FileText, Pill, Dumbbell,
  ChevronRight, Building2, TrendingUp, Shield, Globe, Star, Lock,
  AlertTriangle, UserCheck, Layers2,
} from 'lucide-react';

// ── Feature-flag → nav item map ───────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: any;
  flag?: string;   // if set, only shown when featureFlags[flag] === true
  badge?: boolean; // show live badge
  always?: boolean; // always show regardless of flags
}

const NAV_BY_PORTAL: Record<string, NavItem[]> = {
  clinical: [
    { href: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard, always: true },
    { href: 'my-schedule',  label: 'My Schedule',    icon: Stethoscope,     flag: 'patients' },
    { href: 'whatsapp',     label: 'WhatsApp Inbox', icon: MessageSquare,   flag: 'whatsapp', badge: true },
    { href: 'appointments', label: 'Appointments',   icon: Calendar,        flag: 'appointments' },
    { href: 'prescriptions',label: 'Prescriptions',  icon: Pill,            flag: 'patients' },
    { href: 'visits',       label: 'Visit History',  icon: Activity,        flag: 'patients' },
    { href: 'lab',          label: 'Lab Orders',     icon: FlaskConical,    flag: 'patients' },
    { href: 'patients',     label: 'Patients',       icon: Users,           flag: 'patients' },
    { href: 'doctors',      label: 'Doctors',        icon: Stethoscope,     flag: 'doctors' },
    { href: 'billing',      label: 'Billing',        icon: CreditCard,      flag: 'billing' },
    { href: 'vault',        label: 'Health Vault',   icon: Shield,          always: true },
    { href: 'abha',         label: 'ABHA Linking',   icon: Globe,           always: true },
    { href: 'crm',          label: 'CRM / Leads',    icon: TrendingUp,      flag: 'crm', always: true },
    { href: 'automation',   label: 'Revenue Engine', icon: Zap,             flag: 'whatsapp' },
    { href: 'security',     label: 'Security',       icon: Lock,            always: true },
    { href: 'staff',        label: 'Staff',          icon: UserCheck,       always: true },
    { href: 'branches',     label: 'Branches',       icon: Building2,       always: true },
    { href: 'departments',  label: 'Departments',    icon: Layers2,         always: true },
    { href: 'analytics',    label: 'Analytics',      icon: BarChart3,       always: true },
    { href: 'settings',     label: 'Settings',       icon: Settings,        always: true },
  ],
  diagnostic: [
    { href: 'dashboard',   label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',    label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'lab-orders',  label: 'Lab Orders',      icon: FlaskConical,    always: true },
    { href: 'collection',  label: 'Home Collection', icon: Home,            always: true },
    { href: 'patients',    label: 'Patients',        icon: Users,           always: true },
    { href: 'catalog',     label: 'Test Catalog',    icon: ClipboardList,   always: true },
    { href: 'analytics',   label: 'Analytics',       icon: BarChart3,       always: true },
    { href: 'settings',    label: 'Settings',        icon: Settings,        always: true },
  ],
  pharmacy: [
    { href: 'dashboard',       label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',        label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'products',        label: 'Drug Catalogue',  icon: Pill,            always: true },
    { href: 'inventory',       label: 'Inventory',       icon: Package,         always: true },
    { href: 'alerts',          label: 'Alerts',          icon: AlertTriangle,   always: true },
    { href: 'orders',          label: 'Dispensing',      icon: ShoppingCart,    always: true },
    { href: 'purchase-orders', label: 'Purchase Orders', icon: Truck,           always: true },
    { href: 'marketplace',     label: 'Marketplace',     icon: Globe,           always: true },
    { href: 'analytics',       label: 'Analytics',       icon: BarChart3,       always: true },
    { href: 'settings',        label: 'Settings',        icon: Settings,        always: true },
  ],
  homecare: [
    { href: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',     label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'bookings',     label: 'Bookings',        icon: Calendar,        always: true },
    { href: 'patients',     label: 'Clients',         icon: Users,           always: true },
    { href: 'staff',        label: 'Staff Dispatch',  icon: Truck,           always: true },
    { href: 'visits',       label: 'Home Visits',     icon: Home,            always: true },
    { href: 'analytics',    label: 'Analytics',       icon: BarChart3,       always: true },
    { href: 'settings',     label: 'Settings',        icon: Settings,        always: true },
  ],
  equipment: [
    { href: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',     label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'products',     label: 'Catalogue',       icon: Package,         always: true },
    { href: 'orders',       label: 'B2B Orders',      icon: ShoppingCart,    always: true },
    { href: 'analytics',    label: 'Analytics',       icon: BarChart3,       always: true },
    { href: 'settings',     label: 'Settings',        icon: Settings,        always: true },
  ],
  wellness: [
    { href: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',     label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'bookings',     label: 'Sessions',        icon: Calendar,        always: true },
    { href: 'members',      label: 'Members',         icon: Users,           always: true },
    { href: 'products',     label: 'Products',        icon: Package,         always: true },
    { href: 'analytics',    label: 'Analytics',       icon: BarChart3,       always: true },
    { href: 'settings',     label: 'Settings',        icon: Settings,        always: true },
  ],
  services: [
    { href: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',     label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'contracts',    label: 'Contracts',       icon: FileText,        always: true },
    { href: 'staff',        label: 'Staff',           icon: Users,           always: true },
    { href: 'billing',      label: 'Billing',         icon: CreditCard,      always: true },
    { href: 'analytics',    label: 'Analytics',       icon: BarChart3,       always: true },
    { href: 'settings',     label: 'Settings',        icon: Settings,        always: true },
  ],
};

interface PortalLayoutProps {
  children: React.ReactNode;
  portalSlug: string;
}

export default function PortalLayout({ children, portalSlug }: PortalLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tenant, isAuthenticated, loadFromStorage, logout, featureFlags, hasFlag } = useAuthStore();
  const [assets, setAssets] = useState<PlatformAssets | null>(null);

  // ── Notification bell ─────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs,    setShowNotifs]     = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load notifications from analytics dashboard on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    import('@/lib/api').then(({ api }) => {
      api.get('/analytics/notifications').catch(() =>
        api.get('/analytics/dashboard')
      ).then((res: any) => {
        const d = res.data ?? {};
        const notifs: any[] = [];
        if (d.urgentLabOrders > 0)
          notifs.push({ id: 'lab-urgent', type: 'danger',   title: `${d.urgentLabOrders} urgent lab order${d.urgentLabOrders > 1 ? 's' : ''}`, subtitle: 'Requires immediate attention', href: '/clinical/lab' });
        if (d.pendingAppointments > 0)
          notifs.push({ id: 'appt-pending', type: 'warning', title: `${d.pendingAppointments} appointment${d.pendingAppointments > 1 ? 's' : ''} pending`, subtitle: 'Awaiting confirmation', href: `/${portalSlug}/appointments` });
        if (d.unreadMessages > 0)
          notifs.push({ id: 'wa-unread', type: 'whatsapp', title: `${d.unreadMessages} unread WhatsApp message${d.unreadMessages > 1 ? 's' : ''}`, subtitle: 'Tap to open inbox', href: `/${portalSlug}/whatsapp` });
        if (d.pendingInvoices > 0)
          notifs.push({ id: 'inv-pending', type: 'info',    title: `${d.pendingInvoices} unpaid invoice${d.pendingInvoices > 1 ? 's' : ''}`, subtitle: 'Pending payment collection', href: '/clinical/billing' });
        if (notifs.length === 0)
          notifs.push({ id: 'all-clear', type: 'success', title: 'All caught up!', subtitle: 'No pending items right now' });
        setNotifications(notifs);
      }).catch(() => {
        setNotifications([{ id: 'all-clear', type: 'success', title: 'All caught up!', subtitle: 'No pending items right now' }]);
      });
    });
  }, [isAuthenticated, portalSlug]);

  // ── Global search ──────────────────────────────────────────────────────────
  const [globalSearch,   setGlobalSearch]   = useState('');
  const [searchResults,  setSearchResults]  = useState<any[]>([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!globalSearch || globalSearch.length < 2) { setSearchResults([]); setShowSearchDrop(false); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { api } = await import('@/lib/api');
        const res = await api.get('/patients', { params: { search: globalSearch, limit: 5 } });
        const patients = (res.data.data ?? []).map((p: any) => ({
          id: p.id, type: 'patient',
          title: `${p.firstName} ${p.lastName || ''}`.trim(),
          sub: p.phone ?? p.healthId ?? '',
          href: `/clinical/patients/${p.id}`,
        }));
        setSearchResults(patients);
        setShowSearchDrop(patients.length > 0);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [globalSearch]);
  const navItems = NAV_BY_PORTAL[portalSlug] || NAV_BY_PORTAL.clinical;

  useEffect(() => { loadFromStorage(); }, []);
  useEffect(() => {
    getPlatformAssets().then(setAssets).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      const token = localStorage.getItem('hospibot_access_token');
      if (!token) router.push(`/${portalSlug}/login`);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const visibleNav = navItems.filter(item =>
    item.always || (item.flag ? hasFlag(item.flag) : true)
  );

  const isActive = (href: string) => {
    const full = `/${portalSlug}/${href}`;
    return href === 'dashboard' ? pathname === full : pathname?.startsWith(full);
  };

  const logoSrc = assets?.logoUrl || tenant?.logoUrl || '/hospibot-logo.png';

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col fixed h-full z-20"
        style={{ background: `linear-gradient(180deg, ${theme.sidebarBg} 0%, ${theme.sidebarBg}ee 100%)` }}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <Image src={logoSrc} alt={assets?.logoAlt || 'HospiBot'}
              width={130} height={44} className="object-contain" />
          </div>
        </div>

        {/* Tenant info */}
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-white/90 text-xs font-semibold truncate">{tenant?.name}</p>
          <p className="text-white/40 text-[10px] truncate">
            {tenant?.subType?.name || tenant?.type?.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={`/${portalSlug}/${item.href}`}>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group cursor-pointer',
                  active ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/8'
                )}
                  style={active ? { background: theme.primaryColor } : {}}>
                  <item.icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-white/50 group-hover:text-white')} />
                  <span className="flex-1">{item.label}</span>
                  {(() => {
                    const waNotif = notifications.find(n => n.id === 'wa-unread');
                    const waCount = waNotif?.title?.match(/\d+/)?.[0];
                    return item.badge && !active && waCount ? (
                      <span className="w-5 h-5 bg-[#25D366] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {waCount}
                      </span>
                    ) : null;
                  })()}
                  {active && <ChevronRight className="w-3 h-3 text-white/60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User bottom */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: theme.primaryColor }}>
              {user?.firstName?.[0]}{user?.lastName?.[0] || ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-white/40 text-[10px] truncate">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={logout} className="text-white/40 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative" ref={searchRef}>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-80">
                <Search className={`w-4 h-4 flex-shrink-0 ${searchLoading ? 'text-[#0D7C66] animate-pulse' : 'text-slate-400'}`} />
                <input
                  className="bg-transparent text-sm outline-none flex-1 text-slate-700 placeholder:text-slate-400"
                  placeholder="Search patients, appointments…"
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchDrop(true)}
                />
                {globalSearch && (
                  <button onClick={() => { setGlobalSearch(''); setSearchResults([]); setShowSearchDrop(false); }}
                    className="text-slate-300 hover:text-slate-500 transition-colors text-xs">✕</button>
                )}
              </div>
              {showSearchDrop && searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-4 pt-3 pb-1.5">Patients</p>
                  {searchResults.map(r => (
                    <a key={r.id} href={r.href}
                      onClick={() => { setShowSearchDrop(false); setGlobalSearch(''); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                      <div className="w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{ background: theme.primaryColor }}>
                        {r.title[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                        <p className="text-xs text-slate-400">{r.sub}</p>
                      </div>
                    </a>
                  ))}
                  <div className="border-t border-slate-50 px-4 py-2.5">
                    <a href={`/clinical/patients?search=${encodeURIComponent(globalSearch)}`}
                      onClick={() => { setShowSearchDrop(false); setGlobalSearch(''); }}
                      className="text-xs font-semibold hover:underline" style={{ color: theme.primaryColor }}>
                      View all results for "{globalSearch}" →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {tenant?.plan && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                {tenant.plan}
              </span>
            )}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
                <Bell className="w-4 h-4" />
                {notifications.filter(n => n.type !== 'success').length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifications.filter(n => n.type !== 'success').length}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-slate-400 text-xs">Loading…</div>
                    ) : notifications.map(n => {
                      const colors: Record<string,string> = {
                        warning: 'text-amber-600 bg-amber-50',
                        danger: 'text-red-600 bg-red-50',
                        info: 'text-blue-600 bg-blue-50',
                        whatsapp: 'text-emerald-600 bg-emerald-50',
                        lab: 'text-purple-600 bg-purple-50',
                        success: 'text-emerald-600 bg-emerald-50',
                      };
                      const cls = colors[n.type] || 'text-slate-600 bg-slate-50';
                      const inner = (
                        <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${cls}`}>
                            {n.type === 'success' ? '✓' : n.type === 'warning' ? '⚠' : n.type === 'danger' ? '!' : '•'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 leading-tight">{n.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{n.subtitle}</p>
                          </div>
                        </div>
                      );
                      return n.href ? (
                        <a key={n.id} href={n.href} onClick={() => setShowNotifs(false)}>{inner}</a>
                      ) : <div key={n.id}>{inner}</div>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
