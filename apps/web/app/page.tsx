'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If the user has a stored portal slug, send them to that portal's login.
    // Super Admin (no portalSlug stored) goes to /auth/login.
    const slug = typeof window !== 'undefined'
      ? localStorage.getItem('hospibot_portal_slug')
      : null;
    router.replace(slug ? `/${slug}/login` : '/auth/login');
  }, []);

  return null;
}
