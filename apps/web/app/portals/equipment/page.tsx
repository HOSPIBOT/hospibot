import { PORTALS } from '@/lib/portal-pages-data';
import PortalDetailPage from '@/components/marketing/PortalDetailPage';

const data = PORTALS.find(p => p.slug === 'equipment')!;
export const metadata = { title: `${data.name} — HospiBot`, description: data.heroDesc };
export default function Page() { return <PortalDetailPage data={data} />; }
