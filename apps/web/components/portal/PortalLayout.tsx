'use client';

import { useEffect, useState } from 'react';
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
  ChevronRight, Building2, TrendingUp,
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
    { href: 'whatsapp',     label: 'WhatsApp Inbox', icon: MessageSquare,   flag: 'whatsapp', badge: true },
    { href: 'appointments', label: 'Appointments',   icon: Calendar,        flag: 'appointments' },
    { href: 'patients',     label: 'Patients',       icon: Users,           flag: 'patients' },
    { href: 'doctors',      label: 'Doctors',        icon: Stethoscope,     flag: 'doctors' },
    { href: 'billing',      label: 'Billing',        icon: CreditCard,      flag: 'billing' },
    { href: 'vault',        label: 'Health Vault',   icon: Shield,          always: true },
    { href: 'crm',          label: 'CRM / Leads',    icon: TrendingUp,      flag: 'crm', always: true },
    { href: 'automation',   label: 'Revenue Engine', icon: Zap,             flag: 'whatsapp' },
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
    { href: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',     label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'products',     label: 'Products',        icon: Pill,            always: true },
    { href: 'inventory',    label: 'Inventory',       icon: Package,         always: true },
    { href: 'orders',       label: 'Orders',          icon: ShoppingCart,    always: true },
    { href: 'billing',      label: 'Billing',         icon: CreditCard,      always: true },
    { href: 'analytics',    label: 'Analytics',       icon: BarChart3,       always: true },
    { href: 'settings',     label: 'Settings',        icon: Settings,        always: true },
  ],
  homecare: [
    { href: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',     label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'appointments', label: 'Bookings',        icon: Calendar,        always: true },
    { href: 'patients',     label: 'Clients',         icon: Users,           always: true },
    { href: 'staff',        label: 'Staff Dispatch',  icon: Truck,           always: true },
    { href: 'visits',       label: 'Home Visits',     icon: Home,            always: true },
    { href: 'billing',      label: 'Billing',         icon: CreditCard,      always: true },
    { href: 'analytics',    label: 'Analytics',       icon: BarChart3,       always: true },
    { href: 'settings',     label: 'Settings',        icon: Settings,        always: true },
  ],
  equipment: [
    { href: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',     label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'products',     label: 'Products',        icon: Package,         always: true },
    { href: 'inventory',    label: 'Inventory',       icon: ClipboardList,   always: true },
    { href: 'orders',       label: 'B2B Orders',      icon: ShoppingCart,    always: true },
    { href: 'billing',      label: 'Billing',         icon: CreditCard,      always: true },
    { href: 'analytics',    label: 'Analytics',       icon: BarChart3,       always: true },
    { href: 'settings',     label: 'Settings',        icon: Settings,        always: true },
  ],
  wellness: [
    { href: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard, always: true },
    { href: 'whatsapp',     label: 'WhatsApp Inbox',  icon: MessageSquare,   badge: true, always: true },
    { href: 'appointments', label: 'Bookings',        icon: Calendar,        always: true },
    { href: 'members',      label: 'Members',         icon: Users,           always: true },
    { href: 'products',     label: 'Products',        icon: Package,         flag: 'products' },
    { href: 'billing',      label: 'Billing',         icon: CreditCard,      always: true },
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

  const theme: PortalTheme = FALLBACK_THEMES[portalSlug] || FALLBACK_THEMES.clinical;
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
                  {item.badge && !active && (
                    <span className="w-5 h-5 bg-[#25D366] text-white text-[10px] rounded-full flex items-center justify-center font-bold">4</span>
                  )}
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
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-80">
              <Search className="w-4 h-4 text-slate-400" />
              <input className="bg-transparent text-sm outline-none flex-1 text-slate-700"
                placeholder="Search..." />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {tenant?.plan && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                {tenant.plan}
              </span>
            )}
            <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
