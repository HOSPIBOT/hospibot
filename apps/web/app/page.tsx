'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * HospiBot Marketing Website — served at the root URL
 * Renders the full marketing site via iframe.
 * Listens for postMessage events from the iframe for navigation.
 */
export default function MarketingHome() {
  const router = useRouter();

  useEffect(() => {
    // Listen for navigation requests from the marketing site iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE') {
        const url = event.data.url as string;
        if (url && url.startsWith('/')) {
          router.push(url);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  return (
    <iframe
      src="/site/index.html"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
      title="HospiBot — WhatsApp-First Healthcare Operating System"
    />
  );
}
