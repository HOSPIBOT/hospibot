'use client';

import { useEffect, useRef } from 'react';

/**
 * HospiBot Marketing Website — served at the root URL
 * Full marketing site at /site/index.html rendered full-viewport.
 * All Login/Register buttons wired to real Next.js portal routes.
 */
export default function MarketingHome() {
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
