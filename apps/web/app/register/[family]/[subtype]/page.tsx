'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This route redirects to the unified wizard at /register
export default function RedirectToWizard() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/register');
  }, [router]);
  return null;
}
