'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PORTAL_LINKS = [
  { label:'Clinical Portal',   href:'/clinical/login',   emoji:'🩺' },
  { label:'Diagnostic Portal', href:'/diagnostic/login', emoji:'🔬' },
  { label:'Pharmacy Portal',   href:'/pharmacy/login',   emoji:'💊' },
  { label:'Home Care Portal',  href:'/homecare/login',   emoji:'🏠' },
  { label:'Equipment Portal',  href:'/equipment/login',  emoji:'⚙️'  },
  { label:'Wellness Portal',   href:'/wellness/login',   emoji:'💆' },
  { label:'Services Portal',   href:'/services/login',   emoji:'🤝' },
];

export default function GlobalFooter() {
  const pathname = usePathname();
  // Don't show on homepage (iframe) or portal internal pages
  if (pathname === '/') return null;
  const portalRoutes = ['clinical','diagnostic','pharmacy','homecare','equipment','wellness','services','super-admin'];
  const isPortalPage = portalRoutes.some(p => pathname?.startsWith(`/${p}/`) && !pathname?.endsWith('/login'));
  if (isPortalPage) return null;

  return (
    <footer style={{ background:'linear-gradient(175deg,#060d18 0%,#0a1628 100%)', color:'rgba(255,255,255,0.55)', fontFamily:"'Poppins',sans-serif", position:'relative', overflow:'hidden' }}>
      {/* Top glow line */}
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(13,124,102,0.5),rgba(37,211,102,0.3),rgba(13,124,102,0.5),transparent)' }}/>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'48px clamp(20px,5vw,64px) 24px' }}>
        {/* Main grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1fr 1fr 1fr', gap:40, marginBottom:40 }}>

          {/* Brand */}
          <div>
            <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0D7C66,#25D366)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:15 }}>H</div>
              <span style={{ fontWeight:800, fontSize:17, color:'#fff', letterSpacing:'-0.02em' }}>Hospi<span style={{ color:'#25D366' }}>Bot</span></span>
            </Link>
            <p style={{ fontSize:13.5, lineHeight:1.7, maxWidth:260, marginBottom:20 }}>
              The WhatsApp-First Healthcare Operating System — built for every type of healthcare provider in India and beyond.
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
              {['HIPAA','DPDPA','GDPR','NABH','ABDM'].map(b=>(
                <span key={b} style={{ fontSize:10.5, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'rgba(37,211,102,0.1)', color:'rgba(37,211,102,0.7)', border:'1px solid rgba(37,211,102,0.15)' }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Portals */}
          <div>
            <h4 style={{ color:'#fff', fontSize:12.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Portals</h4>
            {PORTAL_LINKS.slice(0,6).map(p=>(
              <Link key={p.href} href={p.href} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13.5, color:'rgba(255,255,255,0.5)', textDecoration:'none', marginBottom:9, transition:'color 0.18s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#25D366')}
                onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
                <span style={{ fontSize:14 }}>{p.emoji}</span>{p.label}
              </Link>
            ))}
          </div>

          {/* Product */}
          <div>
            <h4 style={{ color:'#fff', fontSize:12.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Product</h4>
            {[['Features','/#features'],['Solutions','/#solutions'],['All Portals','/#portals'],['Register','/register'],['Login','/auth/login']].map(([l,h])=>(
              <Link key={h} href={h} style={{ display:'block', fontSize:13.5, color:'rgba(255,255,255,0.5)', textDecoration:'none', marginBottom:9, transition:'color 0.18s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.9)')}
                onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
                {l}
              </Link>
            ))}
          </div>

          {/* Company + CTA */}
          <div>
            <h4 style={{ color:'#fff', fontSize:12.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Company</h4>
            {[['About Us','/#about'],['Contact','/#contact'],['Careers','/#contact'],['Privacy Policy','/#contact'],['Terms of Service','/#contact']].map(([l,h])=>(
              <Link key={l} href={h} style={{ display:'block', fontSize:13.5, color:'rgba(255,255,255,0.5)', textDecoration:'none', marginBottom:9, transition:'color 0.18s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.9)')}
                onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
                {l}
              </Link>
            ))}
            <div style={{ marginTop:20, padding:16, background:'linear-gradient(135deg,rgba(13,124,102,0.2),rgba(37,211,102,0.08))', border:'1px solid rgba(13,124,102,0.25)', borderRadius:14 }}>
              <p style={{ fontSize:12.5, marginBottom:12, color:'rgba(255,255,255,0.65)', lineHeight:1.5 }}>Register your portal and go live in 7 days.</p>
              <Link href="/register" style={{ display:'block', textAlign:'center', padding:'9px 16px', background:'linear-gradient(135deg,#0D7C66,#047857)', borderRadius:9, color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>
                Get Started Free →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <span style={{ fontSize:12.5 }}>© 2026 HospiBot Technologies Pvt. Ltd. · Made with ❤️ for healthcare providers worldwide</span>
          <span style={{ fontSize:12.5 }}>support@hospibot.in</span>
        </div>
      </div>
    </footer>
  );
}
