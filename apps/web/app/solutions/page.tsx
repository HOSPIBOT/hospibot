import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solutions -- HospiBot Healthcare OS',
  description: 'HospiBot solutions for every type of healthcare provider in India.',
};

const SOLUTIONS = [
  { slug:'clinical',   color:'#0D7C66', dark:'#065F46', light:'#ECFDF5', emoji:'🩺', name:'Clinical Portal',
    headline:'Complete HMS for hospitals & clinics',
    points:['WhatsApp appointment booking & reminders','EMR with voice dictation & prescriptions','OPD / IPD / Bed management','GST billing + Razorpay payments','Recurring revenue automation'],
    stat:'60% fewer no-shows',
  },
  { slug:'diagnostic', color:'#1E3A5F', dark:'#152A47', light:'#EFF6FF', emoji:'🔬', name:'Diagnostic Portal',
    headline:'Lab OS for pathology & radiology centers',
    points:['8-stage sample lifecycle tracking','NABL-ready report generation','WhatsApp PDF report delivery','Home collection GPS management','Corporate wellness screening'],
    stat:'4x faster turnaround',
  },
  { slug:'pharmacy',   color:'#15803D', dark:'#14532D', light:'#F0FDF4', emoji:'💊', name:'Pharmacy Portal',
    headline:'Smart management for retail & hospital pharmacies',
    points:['Prescription scanning & drug checks','Real-time inventory & expiry alerts','GST billing with HSN mapping','Refill automation via WhatsApp','Multi-store management'],
    stat:'70% fewer stockouts',
  },
  { slug:'homecare',   color:'#B45309', dark:'#92400E', light:'#FFFBEB', emoji:'🏠', name:'Home Care Portal',
    headline:'Field operations for home healthcare providers',
    points:['Online booking & agent assignment','Real-time GPS field tracking','Digital visit notes & vitals','Family WhatsApp updates','Insurance & TPA billing'],
    stat:'3x agent productivity',
  },
  { slug:'equipment',  color:'#6D28D9', dark:'#5B21B6', light:'#F5F3FF', emoji:'⚙️',  name:'Equipment Portal',
    headline:'Sales & service ops for medical equipment suppliers',
    points:['Order lifecycle management','AMC & preventive maintenance','Quote & invoice generation','Warranty & recall tracking','Distributor management'],
    stat:'90% AMC renewal rate',
  },
  { slug:'wellness',   color:'#BE185D', dark:'#9D174D', light:'#FFF1F2', emoji:'💆', name:'Wellness Portal',
    headline:'Member & class management for wellness centers',
    points:['Class scheduling & booking via WhatsApp','Member profiles & progress tracking','Membership billing & renewals','Retention automation campaigns','Referral & loyalty programs'],
    stat:'60% higher retention',
  },
  { slug:'services',   color:'#0369A1', dark:'#0C4A6E', light:'#F0F9FF', emoji:'🤝', name:'Services Portal',
    headline:'Ops platform for healthcare service companies',
    points:['Staff placement management','Billing & TPA claim processing','Contract lifecycle management','Medical tourism coordination','Client performance dashboards'],
    stat:'5x client capacity',
  },
];

export default function SolutionsPage() {
  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", background:'#F8FAFC' }}>

      {/* Hero */}
      <section style={{ background:'linear-gradient(160deg,#0A1628 0%,#0F2744 100%)', padding:'80px clamp(20px,5vw,80px) 72px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute',top:'-20%',right:'-10%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,124,102,0.2) 0%,transparent 70%)',filter:'blur(60px)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',backgroundSize:'48px 48px',pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center', position:'relative' }}>
          <div style={{ display:'inline-block',background:'rgba(37,211,102,0.15)',border:'1px solid rgba(37,211,102,0.3)',borderRadius:99,padding:'5px 16px',fontSize:12.5,fontWeight:700,color:'#25D366',marginBottom:20,letterSpacing:'0.06em' }}>
            7 PURPOSE-BUILT PORTALS
          </div>
          <h1 style={{ fontSize:'clamp(28px,4vw,52px)',fontWeight:900,color:'#fff',marginBottom:16,letterSpacing:'-0.02em',lineHeight:1.15 }}>
            One platform. Every type of<br/>healthcare provider.
          </h1>
          <p style={{ fontSize:'clamp(15px,1.5vw,18px)',color:'rgba(255,255,255,0.65)',maxWidth:580,margin:'0 auto 36px',lineHeight:1.75 }}>
            HospiBot is not a generic HMS. Each portal is purpose-built for a specific healthcare segment -- with the workflows, templates, and automations that segment actually needs.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/register" style={{ padding:'13px 28px',borderRadius:12,background:'linear-gradient(135deg,#0D7C66,#047857)',color:'#fff',fontWeight:700,fontSize:15,textDecoration:'none',boxShadow:'0 6px 24px rgba(13,124,102,0.4)' }}>
              Get Started Free
            </Link>
            <Link href="/contact" style={{ padding:'13px 28px',borderRadius:12,background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.8)',fontWeight:600,fontSize:15,textDecoration:'none',border:'1px solid rgba(255,255,255,0.15)' }}>
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Solution cards */}
      <section style={{ padding:'72px clamp(20px,5vw,80px)', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          {SOLUTIONS.map((s, i) => (
            <div key={s.slug} style={{ display:'grid', gridTemplateColumns: i%2===0 ? '1fr 1.4fr' : '1.4fr 1fr', gap:0, borderRadius:24, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.07)', border:'1px solid #E8EDF5' }}>
              {/* Colored panel */}
              <div style={{ order: i%2===0 ? 0 : 1, background:`linear-gradient(145deg,${s.dark},${s.color})`, padding:'40px 44px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute',top:'-20%',right:'-10%',width:280,height:280,borderRadius:'50%',background:'rgba(255,255,255,0.07)',pointerEvents:'none' }}/>
                <div style={{ position:'absolute',bottom:'-15%',left:'-10%',width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none' }}/>
                <div style={{ position:'relative' }}>
                  <div style={{ fontSize:48,marginBottom:16 }}>{s.emoji}</div>
                  <h2 style={{ fontSize:'clamp(20px,2vw,28px)',fontWeight:800,color:'#fff',marginBottom:10,lineHeight:1.25 }}>{s.headline}</h2>
                  <div style={{ display:'inline-block',background:'rgba(255,255,255,0.2)',borderRadius:99,padding:'6px 14px',fontSize:14,fontWeight:700,color:'#fff',marginBottom:20 }}>
                    {s.stat}
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, position:'relative' }}>
                  <Link href={`/portals/${s.slug}`} style={{ flex:1,textAlign:'center',padding:'11px',borderRadius:11,background:'rgba(255,255,255,0.2)',color:'#fff',fontWeight:700,fontSize:13.5,textDecoration:'none',border:'1px solid rgba(255,255,255,0.3)' }}>
                    Explore Portal
                  </Link>
                  <Link href={`/register?portal=${s.slug}`} style={{ flex:1,textAlign:'center',padding:'11px',borderRadius:11,background:'#fff',color:s.color,fontWeight:700,fontSize:13.5,textDecoration:'none' }}>
                    Start Free Trial
                  </Link>
                </div>
              </div>
              {/* White panel */}
              <div style={{ order: i%2===0 ? 1 : 0, background:'#fff', padding:'40px 44px' }}>
                <div style={{ display:'inline-block',background:s.light,color:s.color,fontSize:11.5,fontWeight:700,padding:'3px 12px',borderRadius:99,textTransform:'uppercase' as const,letterSpacing:'0.07em',marginBottom:14 }}>
                  {s.name}
                </div>
                <h3 style={{ fontSize:17,fontWeight:700,color:'#0F172A',marginBottom:18 }}>What you get</h3>
                <div style={{ display:'flex',flexDirection:'column' as const,gap:11 }}>
                  {s.points.map(pt => (
                    <div key={pt} style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
                      <div style={{ width:20,height:20,borderRadius:'50%',background:s.light,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize:14,color:'#334155',lineHeight:1.5 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ background:'#0F172A', padding:'64px clamp(20px,5vw,80px)', textAlign:'center' }}>
        <h2 style={{ fontSize:'clamp(22px,3vw,36px)',fontWeight:800,color:'#fff',marginBottom:12 }}>Not sure which portal fits?</h2>
        <p style={{ fontSize:16,color:'rgba(255,255,255,0.55)',marginBottom:28,maxWidth:480,margin:'0 auto 28px' }}>Our team will help you pick the right portal and get you live in under 7 days.</p>
        <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
          <Link href="/register" style={{ padding:'13px 28px',borderRadius:12,background:'linear-gradient(135deg,#0D7C66,#047857)',color:'#fff',fontWeight:700,fontSize:15,textDecoration:'none' }}>Start Free Trial</Link>
          <Link href="/contact" style={{ padding:'13px 28px',borderRadius:12,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.8)',fontWeight:600,fontSize:15,textDecoration:'none',border:'1px solid rgba(255,255,255,0.12)' }}>Talk to Sales</Link>
        </div>
      </section>
    </div>
  );
}
