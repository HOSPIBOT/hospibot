'use client';

import { useEffect } from 'react';

export default function MarketingHome() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE' && typeof event.data.url === 'string') {
        window.location.href = event.data.url;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      src="/site/index.html"
      style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', border:'none' }}
      title="HospiBot"
    />
  );
}
