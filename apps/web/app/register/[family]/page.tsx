'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// This route redirects to the unified wizard at /register
// The wizard handles all steps in one place
export default function RedirectToWizard() {
  const params = useParams() as any;
  const router = useRouter();
  useEffect(() => {
    router.replace('/register');
  }, [router]);
  return null;
}
