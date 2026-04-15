'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function QcNewRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/diagnostic/qc?log=1'); }, [router]);
  return null;
}
