'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace('/clinical/whatsapp'); }, [router]);
  return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Redirecting to WhatsApp Inbox…</div>;
}
