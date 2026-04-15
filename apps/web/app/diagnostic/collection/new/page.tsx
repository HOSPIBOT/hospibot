'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to collection page which opens booking modal via URL param
export default function NewCollectionRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/diagnostic/collection?book=1');
  }, [router]);
  return null;
}
