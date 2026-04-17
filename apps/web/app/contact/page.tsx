import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact HospiBot -- Get a Demo or Talk to Sales',
  description: 'Contact the HospiBot team for a live demo, sales enquiry, or technical support.',
};

const OFFICES = [
  { city:'Hyderabad', role:'Headquarters', detail:'India Operations', flag:'🇮🇳' },
  { city:'Dubai', role:'Middle East', detail:'UAE & GCC Expansion', flag:'🇦🇪' },
  { city:'Singapore', role:'Southeast Asia', detail:'APAC Expansion', flag:'🇸🇬' },
];

const FAQS = [
  { q:'How quickly can I go live?', a:'Most customers are live within 7 days. Our onboarding wizard guides you through setup step by step -- no IT team needed.' },
  { q:'Which portals can I register for?', a:'You can register for Clinical, Diagnostic, Pharmacy, Home Care, Equipment, Wellness, or Services portals. Each is purpose-built for that segment.' },
  { q:'Is there a free trial?', a:'Yes -- every new account gets a 14-day free trial with full access. No credit card required.' },
  { q:'Does HospiBot work for small clinics?', a:'Absolutely. Solo doctors and small clinics are our most common users. The Starter plan is designed specifically for small practices.' },
  { q:'Is patient data secure?', a:'Yes. HospiBot is HIPAA and DPDPA compliant. All data is encrypted at rest and in transit. Each tenant is fully isolated.' },
  { q:'Can I migrate data from my existing software?', a:'Yes. We support data migration from Practo, Clinikk, MocDoc, and CSV exports from most clinic software.' },
];

export default function ContactPage() {
  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", background:'#F8FAFC' }}>

      {/* Hero */}
      <section style={{ background:'linear-gradient(160deg,#0A1628 0%,#0F2744 100%)', padding:'72px clamp(20px,5vw,80px) 60px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute',top:'-20%',right:0,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,124,102,0.15) 0%,transparent 70%)',filter:'blur(50px)',pointerEvents:'none' }}/>
        <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center', position:'relative' }}>
          <h1 style={{ fontSize:'clamp(28px,4vw,48px)',fontWeight:900,color:'#fff',marginBottom:14,letterSpacing:'-0.02em' }}>
            Talk to the HospiBot team
          </h1>
          <p style={{ fontSize:16,color:'rgba(255,255,255,0.6)',lineHeight:1.75,marginBottom:8 }}>
            Get a live demo, ask a product question, or start your free trial. We respond within 24 hours on business days.
          </p>
        </div>
      </section>

      {/* Main contact grid */}
      <section style={{ padding:'64px clamp(20px,5vw,80px)', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:40 }}>

          {/* Contact cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Email */}
            <div style={{ background:'#fff',borderRadius:20,padding:'28px',border:'1px solid #E8EDF5',boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:16 }}>
                <div style={{ width:48,height:48,borderRadius:14,background:'#ECFDF5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>📧</div>
                <div>
                  <div style={{ fontSize:16,fontWeight:700,color:'#0F172A' }}>Email us</div>
                  <div style={{ fontSize:13,color:'#64748B' }}>We reply within 24 hours</div>
                </div>
              </div>
              <a href="mailto:hello@hospibot.in" style={{ display:'block',fontSize:15.5,fontWeight:600,color:'#0D7C66',textDecoration:'none',marginBottom:6 }}>hello@hospibot.in</a>
              <a href="mailto:support@hospibot.in" style={{ display:'block',fontSize:14.5,color:'#64748B',textDecoration:'none' }}>support@hospibot.in (technical support)</a>
            </div>

            {/* WhatsApp */}
            <div style={{ background:'#fff',borderRadius:20,padding:'28px',border:'1px solid #E8EDF5',boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:16 }}>
                <div style={{ width:48,height:48,borderRadius:14,background:'#F0FDF4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>💬</div>
                <div>
                  <div style={{ fontSize:16,fontWeight:700,color:'#0F172A' }}>WhatsApp</div>
                  <div style={{ fontSize:13,color:'#64748B' }}>Chat with us instantly</div>
                </div>
              </div>
              <a href="https://wa.me/919000000000" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:10,background:'#25D366',color:'#fff',fontWeight:700,fontSize:14,textDecoration:'none' }}>
                Chat on WhatsApp
              </a>
            </div>

            {/* Demo booking */}
            <div style={{ background:'linear-gradient(135deg,#0D7C66,#047857)',borderRadius:20,padding:'28px',position:'relative',overflow:'hidden' }}>
              <div style={{ position:'absolute',top:'-20%',right:'-10%',width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,0.06)',pointerEvents:'none' }}/>
              <div style={{ fontSize:24,marginBottom:12 }}>📅</div>
              <h3 style={{ fontSize:17,fontWeight:700,color:'#fff',marginBottom:8 }}>Book a live demo</h3>
              <p style={{ fontSize:13.5,color:'rgba(255,255,255,0.75)',lineHeight:1.65,marginBottom:16 }}>See HospiBot in action with a personalised 30-minute walkthrough for your practice type.</p>
              <a href="mailto:demo@hospibot.in?subject=Demo Request" style={{ display:'inline-block',padding:'10px 22px',borderRadius:10,background:'#fff',color:'#0D7C66',fontWeight:700,fontSize:14,textDecoration:'none' }}>
                Request a Demo
              </a>
            </div>
          </div>

          {/* FAQs */}
          <div>
            <h2 style={{ fontSize:'clamp(18px,2vw,26px)',fontWeight:800,color:'#0F172A',marginBottom:24,letterSpacing:'-0.02em' }}>Frequently asked questions</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {FAQS.map(f => (
                <div key={f.q} style={{ background:'#fff',borderRadius:14,padding:'18px 20px',border:'1px solid #E8EDF5' }}>
                  <div style={{ fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:7 }}>{f.q}</div>
                  <div style={{ fontSize:13.5,color:'#64748B',lineHeight:1.65 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Offices */}
      <section style={{ padding:'48px clamp(20px,5vw,80px)', background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(18px,2vw,26px)',fontWeight:800,color:'#0F172A',marginBottom:28,textAlign:'center',letterSpacing:'-0.02em' }}>Where we operate</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20 }}>
            {OFFICES.map(o => (
              <div key={o.city} style={{ background:'#F8FAFC',borderRadius:16,padding:'24px 20px',border:'1px solid #E8EDF5',textAlign:'center' }}>
                <div style={{ fontSize:32,marginBottom:10 }}>{o.flag}</div>
                <div style={{ fontSize:17,fontWeight:700,color:'#0F172A',marginBottom:4 }}>{o.city}</div>
                <div style={{ fontSize:13,fontWeight:600,color:'#0D7C66',marginBottom:4 }}>{o.role}</div>
                <div style={{ fontSize:12.5,color:'#94A3B8' }}>{o.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ background:'#0F172A',padding:'56px clamp(20px,5vw,80px)',textAlign:'center' }}>
        <h2 style={{ fontSize:'clamp(20px,2.5vw,32px)',fontWeight:800,color:'#fff',marginBottom:10 }}>Ready to get started?</h2>
        <p style={{ fontSize:15,color:'rgba(255,255,255,0.5)',marginBottom:24 }}>No sales call needed. Sign up and be live in 7 days.</p>
        <Link href="/register" style={{ padding:'13px 32px',borderRadius:12,background:'linear-gradient(135deg,#0D7C66,#047857)',color:'#fff',fontWeight:700,fontSize:15,textDecoration:'none',display:'inline-block' }}>
          Start Free Trial -- No Credit Card
        </Link>
      </section>
    </div>
  );
}
