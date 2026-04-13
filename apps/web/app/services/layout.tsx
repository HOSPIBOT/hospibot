import PortalLayoutComponent from '@/components/portal/PortalLayout';
export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutComponent portalSlug="services">{children}</PortalLayoutComponent>;
}
