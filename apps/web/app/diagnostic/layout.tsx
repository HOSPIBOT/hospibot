import PortalLayoutComponent from '@/components/portal/PortalLayout';
import TierUpgradeModal from '@/components/portal/TierUpgradeModal';
export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayoutComponent portalSlug="diagnostic">
      {children}
      <TierUpgradeModal />
    </PortalLayoutComponent>
  );
}
