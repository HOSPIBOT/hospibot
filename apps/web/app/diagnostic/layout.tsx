import PortalLayoutComponent from '@/components/portal/PortalLayout';
export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutComponent portalSlug="diagnostic">{children}</PortalLayoutComponent>;
}
