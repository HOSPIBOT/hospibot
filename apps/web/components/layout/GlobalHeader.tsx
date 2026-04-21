'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home',      href: '/' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Features',  href: '/features' },
  { label: 'About',     href: '/about' },
  { label: 'Contact',   href: '/contact' },
];

const PORTALS = [
  { label: 'Clinical Portal',   href: '/portals/clinical',   emoji: '🩺', sub: '75 subtypes' },
  { label: 'Diagnostic Portal', href: '/portals/diagnostic', emoji: '🔬', sub: '34 subtypes' },
  { label: 'Pharmacy Portal',   href: '/portals/pharmacy',   emoji: '💊', sub: '14 subtypes' },
  { label: 'Home Care Portal',  href: '/portals/homecare',   emoji: '🏠', sub: '12 subtypes' },
  { label: 'Equipment Portal',  href: '/portals/equipment',  emoji: '🔧', sub: '10 subtypes' },
  { label: 'Wellness Portal',   href: '/portals/wellness',   emoji: '🧘', sub: '11 subtypes' },
  { label: 'Services Portal',   href: '/portals/services',   emoji: '🛎️', sub: '8 subtypes' },
];

export default function GlobalHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => { setMobileOpen(false); setPortalsOpen(false); }, [pathname]);

  // Detect portal color from pathname
  const portalColors: Record<string, string> = {
    clinical: '#0D7C66', diagnostic: '#1E3A5F', pharmacy: '#15803D',
    homecare: '#B45309', equipment: '#6D28D9', wellness: '#BE185D', services: '#0369A1',
  };
  const currentPortal = Object.keys(portalColors).find(p => pathname?.startsWith(`/${p}/`));
  const accentColor = currentPortal ? portalColors[currentPortal] : '#0D7C66';

  const isRegister = pathname?.startsWith('/register');
  const isAuth = pathname?.startsWith('/auth');
  const isPublic = !currentPortal && !pathname?.startsWith('/super-admin');

  // Don't show on homepage (iframe) or portal dashboard pages
  if (currentPortal && !pathname?.endsWith('/login')) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        .gh-nav { font-family: 'Poppins', sans-serif; }
        .gh-link { transition: color 0.18s, opacity 0.18s; }
        .gh-link:hover { opacity: 1 !important; }
        .gh-portal-item:hover { background: rgba(255,255,255,0.06) !important; }
        .gh-cta-demo:hover { opacity: 0.9; transform: translateY(-1px); }
        .gh-cta-login:hover { background: rgba(255,255,255,0.12) !important; }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .gh-dropdown { animation: fadeDown 0.18s ease both; }
        @keyframes slideDown { from { opacity:0; max-height:0; } to { opacity:1; max-height:600px; } }
        .gh-mobile { animation: slideDown 0.25s ease both; }
      `}</style>

      <nav className="gh-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
        height: 64,
        background: scrolled
          ? 'rgba(10,22,40,0.98)'
          : 'rgba(10,22,40,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px, 4vw, 48px)',
      }}>

        {/* Logo */}
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0D7C66,#25D366)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:16, boxShadow:'0 4px 12px rgba(13,124,102,0.4)', flexShrink:0 }}>H</div>
          <span style={{ fontWeight:800, fontSize:17, color:'#fff', letterSpacing:'-0.02em' }}>Hospi<span style={{ color:'#25D366' }}>Bot</span></span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display:'flex', alignItems:'center', gap:4, flex:1, justifyContent:'center' }}>
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} className="gh-link"
              style={{ padding:'6px 14px', borderRadius:8, fontSize:14, fontWeight:500, color: pathname===link.href ? '#fff' : 'rgba(255,255,255,0.65)', textDecoration:'none', opacity: pathname===link.href ? 1 : 0.85, background: pathname===link.href ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
              {link.label}
            </Link>
          ))}

          {/* All Portals dropdown */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setPortalsOpen(v => !v)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, fontSize:14, fontWeight:600, color:'#25D366', background: portalsOpen ? 'rgba(37,211,102,0.1)' : 'transparent', border:'none', cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
              All Portals <ChevronDown size={14} style={{ transform: portalsOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
            </button>
            {portalsOpen && (
              <div className="gh-dropdown" style={{ position:'absolute', top:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)', background:'rgba(10,22,40,0.98)', backdropFilter:'blur(20px)', borderRadius:14, border:'1px solid rgba(255,255,255,0.1)', padding:8, minWidth:220, boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}
                onMouseLeave={() => setPortalsOpen(false)}>
                {PORTALS.map(p => (
                  <Link key={p.href} href={p.href} className="gh-portal-item"
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:9, textDecoration:'none', color:'rgba(255,255,255,0.8)', fontSize:13.5, fontWeight:500 }}>
                    <span style={{ fontSize:17 }}>{p.emoji}</span> {p.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <Link href="/auth/login" className="gh-cta-login"
            style={{ padding:'7px 16px', borderRadius:9, fontSize:13.5, fontWeight:600, color:'rgba(255,255,255,0.8)', textDecoration:'none', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', transition:'all 0.2s' }}>
            Login
          </Link>
          <Link href="/register"
            className="gh-cta-demo"
            style={{ padding:'7px 18px', borderRadius:9, fontSize:13.5, fontWeight:700, color:'#fff', textDecoration:'none', background:`linear-gradient(135deg,${accentColor},${accentColor}bb)`, boxShadow:`0 4px 14px ${accentColor}44`, transition:'all 0.2s', display:'inline-block' }}>
            Get Demo
          </Link>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(v => !v)}
            style={{ display:'none', padding:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, cursor:'pointer', color:'#fff' }}
            aria-label="Toggle menu">
            {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="gh-mobile" style={{ position:'fixed', top:64, left:0, right:0, zIndex:8999, background:'rgba(10,22,40,0.98)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'16px clamp(16px,4vw,48px) 24px', fontFamily:"'Poppins',sans-serif" }}>
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} style={{ display:'block', padding:'10px 0', fontSize:15, fontWeight:500, color:'rgba(255,255,255,0.75)', textDecoration:'none', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>{link.label}</Link>
          ))}
          <div style={{ paddingTop:12, paddingBottom:4, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Portals</div>
          {PORTALS.map(p => (
            <Link key={p.href} href={p.href} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 0', fontSize:14, color:'rgba(255,255,255,0.7)', textDecoration:'none', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span>{p.emoji}</span> {p.label}
            </Link>
          ))}
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <Link href="/auth/login" style={{ flex:1, textAlign:'center', padding:'10px', borderRadius:10, fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.8)', textDecoration:'none', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>Login</Link>
            <Link href="/register" style={{ flex:1, textAlign:'center', padding:'10px', borderRadius:10, fontSize:14, fontWeight:700, color:'#fff', textDecoration:'none', background:'linear-gradient(135deg,#0D7C66,#047857)' }}>Register Free</Link>
          </div>
        </div>
      )}

      {/* Spacer to push content below fixed header */}
      <div style={{ height: 64 }} />
    </>
  );
}
