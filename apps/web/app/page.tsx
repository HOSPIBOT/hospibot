'use client';

import { useEffect } from 'react';

export default function MarketingHome() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      // Portal navigation — navigate top-level window
      if (event.data.type === 'NAVIGATE' && typeof event.data.url === 'string') {
        window.location.href = event.data.url;
      }
      // URL hash update for internal SPA sections — update browser address bar
      if (event.data.type === 'URL_UPDATE' && typeof event.data.url === 'string') {
        try { window.history.replaceState({}, '', event.data.url); } catch(e) {}
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      src="/site/index.html"
      style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', border:'none', display:'block' }}
      title="HospiBot — WhatsApp-First Healthcare Operating System"
    />
  );
}
