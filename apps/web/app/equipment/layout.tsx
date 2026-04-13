import PortalLayoutComponent from '@/components/portal/PortalLayout';
export default function EquipmentLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutComponent portalSlug="equipment">{children}</PortalLayoutComponent>;
}
