import PortalLayoutComponent from '@/components/portal/PortalLayout';
export default function ClinicalLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutComponent portalSlug="clinical">{children}</PortalLayoutComponent>;
}
