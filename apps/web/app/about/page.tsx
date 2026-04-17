import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About HospiBot -- WhatsApp-First Healthcare OS',
  description: 'HospiBot is building the WhatsApp-first healthcare operating system for India, Middle East, and Southeast Asia.',
};

const STATS = [
  { value:'9', label:'Portal types built' },
  { value:'153+', label:'Pages & screens' },
  { value:'232', label:'API endpoints' },
  { value:'7 days', label:'Average go-live time' },
];

const VALUES = [
  { icon:'💬', title:'WhatsApp-first by design', desc:'Healthcare in India runs on WhatsApp. We built our entire platform around this reality -- not as an afterthought, but as the core channel for every patient interaction.' },
  { icon:'🏥', title:'Built for India, ready for the world', desc:'GST billing, ABHA integration, NABH compliance, and regional language support built in. Expanding to the Middle East and Southeast Asia with local compliance frameworks.' },
  { icon:'⚡', title:'Speed over everything', desc:'Most healthcare software takes months to implement. HospiBot goes live in 7 days. Self-serve onboarding, pre-built templates, and zero IT dependency.' },
  { icon:'🔒', title:'Security without compromise', desc:'HIPAA and DPDPA compliant from day one. Patient data is encrypted, isolated per tenant, and never shared without explicit consent.' },
];

const TIMELINE = [
  { year:'2025', title:'HospiBot founded', desc:'Vision: build the WhatsApp-first healthcare OS for every type of provider in India.' },
  { year:'2025', title:'Platform architecture', desc:'Multi-tenant NestJS backend, Next.js frontend, Supabase PostgreSQL. 9 portal families designed.' },
  { year:'2026', title:'Diagnostic & Clinical portals live', desc:'First two portal families launched. 153 pages, 232 API endpoints, full WhatsApp automation.' },
  { year:'2026', title:'All 7 portals launched', desc:'Pharmacy, Home Care, Equipment, Wellness, Services portals launched. Pilot customers onboarding.' },
];

export default function AboutPage() {
  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", background:'#F8FAFC' }}>

      {/* Hero */}
      <section style={{ background:'linear-gradient(160deg,#0A1628 0%,#0F2744 100%)', padding:'80px clamp(20px,5vw,80px) 72px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute',top:'-20%',right:'-10%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,124,102,0.15) 0%,transparent 70%)',filter:'blur(60px)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',backgroundSize:'48px 48px',pointerEvents:'none' }}/>
        <div style={{ maxWidth:900, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'inline-block',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.25)',borderRadius:99,padding:'5px 16px',fontSize:12.5,fontWeight:700,color:'#25D366',marginBottom:20,letterSpacing:'0.06em' }}>
            OUR MISSION
          </div>
          <h1 style={{ fontSize:'clamp(28px,4vw,52px)',fontWeight:900,color:'#fff',marginBottom:20,letterSpacing:'-0.02em',lineHeight:1.15 }}>
            We are building the healthcare<br/>OS that India deserves
          </h1>
          <p style={{ fontSize:'clamp(15px,1.5vw,18px)',color:'rgba(255,255,255,0.65)',lineHeight:1.8,maxWidth:680,marginBottom:40 }}>
            700 million Indians use WhatsApp daily. Yet most hospitals and clinics still manage appointments on paper, send reports via courier, and chase payments over phone calls. HospiBot changes that -- permanently.
          </p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.08)',borderRadius:14,padding:'18px 16px',border:'1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize:'clamp(24px,2.5vw,34px)',fontWeight:900,color:'#fff',lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:12.5,color:'rgba(255,255,255,0.55)',marginTop:6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding:'72px clamp(20px,5vw,80px)', background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <h2 style={{ fontSize:'clamp(22px,3vw,36px)',fontWeight:800,color:'#0F172A',marginBottom:10,letterSpacing:'-0.02em' }}>What we believe</h2>
            <p style={{ fontSize:16,color:'#64748B',maxWidth:520,margin:'0 auto',lineHeight:1.7 }}>These principles shape every decision we make about the platform.</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:24 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ background:'#F8FAFC',borderRadius:20,padding:'28px 24px',border:'1px solid #E8EDF5' }}>
                <div style={{ fontSize:36,marginBottom:14 }}>{v.icon}</div>
                <h3 style={{ fontSize:15.5,fontWeight:700,color:'#0F172A',marginBottom:10,lineHeight:1.35 }}>{v.title}</h3>
                <p style={{ fontSize:13.5,color:'#64748B',lineHeight:1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding:'72px clamp(20px,5vw,80px)', background:'#F8FAFC' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(22px,3vw,34px)',fontWeight:800,color:'#0F172A',marginBottom:44,letterSpacing:'-0.02em',textAlign:'center' }}>Our journey</h2>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute',left:48,top:0,bottom:0,width:2,background:'#E2E8F0' }}/>
            {TIMELINE.map((t, i) => (
              <div key={i} style={{ display:'flex',gap:24,marginBottom:36,position:'relative' }}>
                <div style={{ width:96,flexShrink:0,textAlign:'right',paddingTop:3 }}>
                  <span style={{ fontSize:13,fontWeight:700,color:'#0D7C66' }}>{t.year}</span>
                </div>
                <div style={{ width:16,height:16,borderRadius:'50%',background:'#0D7C66',border:'3px solid #fff',flexShrink:0,marginTop:3,position:'relative',zIndex:1,boxShadow:'0 0 0 3px #0D7C6620' }}/>
                <div style={{ flex:1,paddingBottom:8 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:'#0F172A',marginBottom:5 }}>{t.title}</div>
                  <div style={{ fontSize:13.5,color:'#64748B',lineHeight:1.6 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section style={{ padding:'64px clamp(20px,5vw,80px)', background:'#0F172A' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(20px,2.5vw,32px)',fontWeight:800,color:'#fff',marginBottom:10 }}>Built on world-class technology</h2>
          <p style={{ fontSize:15,color:'rgba(255,255,255,0.5)',marginBottom:36 }}>Production-grade stack. Enterprise security. Infinite scale.</p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:12,justifyContent:'center',marginBottom:40 }}>
            {['Next.js 14','NestJS','PostgreSQL','Supabase','Razorpay','WhatsApp Business API','Prisma ORM','Railway','Vercel','FHIR R4 / ABDM'].map(t => (
              <span key={t} style={{ padding:'7px 14px',borderRadius:99,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)',fontSize:13,fontWeight:500,border:'1px solid rgba(255,255,255,0.1)' }}>{t}</span>
            ))}
          </div>
          <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
            <Link href="/register" style={{ padding:'13px 28px',borderRadius:12,background:'linear-gradient(135deg,#0D7C66,#047857)',color:'#fff',fontWeight:700,fontSize:15,textDecoration:'none' }}>Get Started Free</Link>
            <Link href="/contact" style={{ padding:'13px 28px',borderRadius:12,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.8)',fontWeight:600,fontSize:15,textDecoration:'none',border:'1px solid rgba(255,255,255,0.12)' }}>Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
