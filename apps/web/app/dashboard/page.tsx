'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Legacy dashboard — superseded by /clinical/dashboard
export default function LegacyDashboardRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/clinical/dashboard'); }, [router]);
  return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
      Redirecting to Clinical Portal…
    </div>
  );
}
