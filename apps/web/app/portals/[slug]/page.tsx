import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PORTALS, type PortalData } from './portal-data';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const p: PortalData | undefined = PORTALS[params.slug];
  if (!p) return {};
  return { title: `${p.name} -- HospiBot`, description: p.desc.slice(0, 155) };
}

export default function PortalPage({ params }: { params: { slug: string } }) {
  const portal: PortalData | undefined = PORTALS[params.slug];
  if (!portal) { notFound(); return null; }

  const { name, tagline, desc, emoji, color, dark, light,
          stats, features, benefits, usecases, workflow } = portal;

  const wfIcons = ['💬','⚡','💰','🔄'];

  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", background:'#F8FAFC', minHeight:'100vh' }}>

      {/* HERO */}
      <section style={{ background:dark, padding:'80px clamp(20px,5vw,80px) 72px', position:'relative', overflow:'hidden', minHeight:480 }}>
        <div style={{ position:'absolute',inset:0, background:`linear-gradient(135deg,${dark} 0%,${color}ee 45%,${color}88 100%)`, pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:'-15%',right:'-8%',width:500,height:500,borderRadius:'50%',background:`radial-gradient(circle,${color}60 0%,${color}20 40%,transparent 70%)`,filter:'blur(40px)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',bottom:'-10%',left:'-5%',width:380,height:380,borderRadius:'50%',background:`radial-gradient(circle,${dark}ff 0%,${color}40 50%,transparent 70%)`,filter:'blur(50px)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`,backgroundSize:'48px 48px',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:'10%',right:'8%',width:300,height:300,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.06)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:'5%',right:'3%',width:440,height:440,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.04)',pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:99,padding:'5px 14px',fontSize:12.5,fontWeight:600,color:'rgba(255,255,255,0.85)',marginBottom:24,letterSpacing:'0.04em' }}>
            {emoji} HOSPIBOT {name.toUpperCase()}
          </div>
          <h1 style={{ fontSize:'clamp(28px,4.5vw,54px)',fontWeight:900,color:'#fff',lineHeight:1.15,marginBottom:18,letterSpacing:'-0.02em',maxWidth:800 }}>{tagline}</h1>
          <p style={{ fontSize:'clamp(15px,1.5vw,18px)',color:'rgba(255,255,255,0.75)',lineHeight:1.75,maxWidth:640,marginBottom:36 }}>{desc}</p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:12,marginBottom:56 }}>
            <Link href={`/register?portal=${params.slug}`} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'14px 28px',borderRadius:12,background:'#fff',color:color,fontWeight:800,fontSize:15,textDecoration:'none',boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
              Register Free -- 14 Days Trial
            </Link>
            <Link href={`/${params.slug}/login`} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'14px 28px',borderRadius:12,background:'rgba(255,255,255,0.12)',color:'#fff',fontWeight:700,fontSize:15,textDecoration:'none',border:'1.5px solid rgba(255,255,255,0.3)' }}>
              Login to Portal
            </Link>
            <Link href="/contact" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'14px 28px',borderRadius:12,background:'transparent',color:'rgba(255,255,255,0.7)',fontWeight:600,fontSize:15,textDecoration:'none',border:'1.5px solid rgba(255,255,255,0.2)' }}>
              Book a Demo
            </Link>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.12)',borderRadius:16,padding:'20px 18px',border:'1px solid rgba(255,255,255,0.2)',backdropFilter:'blur(12px)',boxShadow:'0 4px 24px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize:'clamp(22px,3vw,34px)',fontWeight:900,color:'#fff',lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:13,color:'rgba(255,255,255,0.65)',marginTop:6,fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:'80px clamp(20px,5vw,80px)',background:'#F4F6F8',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:`radial-gradient(${color}12 1.5px,transparent 1.5px)`,backgroundSize:'28px 28px',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:0,right:0,width:300,height:300,background:`radial-gradient(circle at top right,${light},transparent 70%)`,pointerEvents:'none' }}/>
        <div style={{ position:'absolute',bottom:0,left:0,width:250,height:250,background:`radial-gradient(circle at bottom left,${light},transparent 70%)`,pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100,margin:'0 auto',position:'relative' }}>
          <div style={{ textAlign:'center',marginBottom:56 }}>
            <div style={{ display:'inline-block',background:light,color:color,fontSize:12,fontWeight:700,padding:'4px 14px',borderRadius:99,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:14 }}>Everything you need</div>
            <h2 style={{ fontSize:'clamp(24px,3vw,38px)',fontWeight:800,color:'#0F172A',marginBottom:12,letterSpacing:'-0.02em' }}>Built for how you actually work</h2>
            <p style={{ fontSize:16,color:'#64748B',maxWidth:560,margin:'0 auto',lineHeight:1.7 }}>
              Every feature in the {name} is designed specifically for your practice type -- not repurposed generic software.
            </p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:20 }}>
            {features.map(f => (
              <div key={f.title} style={{ background:'#fff',borderRadius:18,padding:'24px 22px',border:`1.5px solid ${light}`,boxShadow:'0 6px 28px rgba(0,0,0,0.1)',position:'relative',overflow:'hidden' }}>
                <div style={{ width:46,height:46,borderRadius:13,background:light,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:14 }}>{f.icon}</div>
                <h3 style={{ fontSize:15.5,fontWeight:700,color:'#0F172A',marginBottom:8,lineHeight:1.35 }}>{f.title}</h3>
                <p style={{ fontSize:13.5,color:'#64748B',lineHeight:1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background:'#0A0F1E',padding:'80px clamp(20px,5vw,80px)',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:700,height:500,borderRadius:'50%',background:`radial-gradient(ellipse,${color}30 0%,${color}10 40%,transparent 70%)`,filter:'blur(60px)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,backgroundSize:'56px 56px',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:0,left:0,width:200,height:200,background:`radial-gradient(circle,${color}20,transparent 70%)`,filter:'blur(30px)',pointerEvents:'none' }}/>
        <div style={{ maxWidth:1000,margin:'0 auto',position:'relative' }}>
          <div style={{ textAlign:'center',marginBottom:52 }}>
            <div style={{ display:'inline-block',background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:12,fontWeight:700,padding:'4px 14px',borderRadius:99,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:14 }}>How it works</div>
            <h2 style={{ fontSize:'clamp(22px,3vw,36px)',fontWeight:800,color:'#fff',marginBottom:10,letterSpacing:'-0.02em' }}>From sign-up to patient care in 4 steps</h2>
            <p style={{ fontSize:15.5,color:'rgba(255,255,255,0.7)',maxWidth:520,margin:'0 auto' }}>Go live in under 7 days. No complex implementation. No IT team needed.</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:20 }}>
            {workflow.map((w, i) => (
              <div key={w.step} style={{ background:'rgba(255,255,255,0.08)',borderRadius:18,padding:'24px 20px',border:'1px solid rgba(255,255,255,0.15)',backdropFilter:'blur(16px)',boxShadow:'0 4px 20px rgba(0,0,0,0.2)',position:'relative',overflow:'hidden' }}>
                <div style={{ fontSize:11,fontWeight:800,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:10 }}>STEP {w.step}</div>
                <div style={{ width:40,height:40,borderRadius:12,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:12 }}>
                  {wfIcons[i]}
                </div>
                <h4 style={{ fontSize:14.5,fontWeight:700,color:'#fff',marginBottom:8,lineHeight:1.35 }}>{w.title}</h4>
                <p style={{ fontSize:12.5,color:'rgba(255,255,255,0.65)',lineHeight:1.6 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS + USE CASES */}
      <section style={{ padding:'80px clamp(20px,5vw,80px)',background:'#EEF1F5',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:`repeating-linear-gradient(135deg,transparent,transparent 40px,${color}06 40px,${color}06 41px)`,pointerEvents:'none' }}/>
        <div style={{ position:'absolute',right:0,top:'20%',width:400,height:400,background:`radial-gradient(circle,${light} 0%,transparent 70%)`,pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100,margin:'0 auto',position:'relative' }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center' }}>
            <div>
              <div style={{ display:'inline-block',background:light,color:color,fontSize:12,fontWeight:700,padding:'4px 14px',borderRadius:99,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:16 }}>Why choose HospiBot</div>
              <h2 style={{ fontSize:'clamp(22px,2.8vw,36px)',fontWeight:800,color:'#0F172A',marginBottom:14,letterSpacing:'-0.02em',lineHeight:1.25 }}>Real results from day one</h2>
              <p style={{ fontSize:15.5,color:'#64748B',lineHeight:1.75,marginBottom:28 }}>
                HospiBot is not just software -- it is an operating system that transforms how you run your practice, engage patients, and grow revenue.
              </p>
              <div style={{ display:'flex',flexDirection:'column' as const,gap:16 }}>
                {benefits.map(b => (
                  <div key={b.title} style={{ display:'flex',gap:14,alignItems:'flex-start',background:'#fff',borderRadius:14,padding:'16px 18px',border:'1px solid #E8ECF0',boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
                    <div style={{ width:42,height:42,borderRadius:12,background:light,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0 }}>{b.icon}</div>
                    <div>
                      <div style={{ fontSize:14.5,fontWeight:700,color:'#0F172A',marginBottom:3 }}>{b.title}</div>
                      <div style={{ fontSize:13.5,color:'#64748B',lineHeight:1.6 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex',flexDirection:'column' as const,gap:14 }}>
              <div style={{ fontSize:13,fontWeight:700,color:color,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:4 }}>Best suited for</div>
              {usecases.map(u => (
                <div key={u.title} style={{ background:'#fff',borderRadius:16,padding:'18px 20px',border:`1.5px solid ${light}`,boxShadow:'0 6px 24px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize:14.5,fontWeight:700,color:'#0F172A',marginBottom:5 }}>{u.title}</div>
                  <div style={{ fontSize:13.5,color:'#64748B',lineHeight:1.55 }}>{u.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background:'#0F172A',padding:'72px clamp(20px,5vw,80px)',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:800,height:400,background:`radial-gradient(ellipse,${color}35 0%,${color}10 50%,transparent 70%)`,filter:'blur(50px)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:600,borderRadius:'50%',border:`1px solid ${color}20`,pointerEvents:'none' }}/>
        <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)`,backgroundSize:'50px 50px',pointerEvents:'none' }}/>
        <div style={{ maxWidth:700,margin:'0 auto',textAlign:'center',position:'relative' }}>
          <div style={{ fontSize:36,marginBottom:16 }}>{emoji}</div>
          <h2 style={{ fontSize:'clamp(24px,3vw,38px)',fontWeight:800,color:'#fff',marginBottom:12,letterSpacing:'-0.02em' }}>
            Ready to transform your {params.slug} practice?
          </h2>
          <p style={{ fontSize:16,color:'rgba(255,255,255,0.6)',lineHeight:1.75,marginBottom:36 }}>
            Join thousands of healthcare providers already using HospiBot. Start your 14-day free trial -- no credit card required.
          </p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:12,justifyContent:'center' }}>
            <Link href={`/register?portal=${params.slug}`} style={{ display:'inline-flex',alignItems:'center',padding:'15px 32px',borderRadius:13,background:`linear-gradient(135deg,${color},${dark})`,color:'#fff',fontWeight:800,fontSize:15.5,textDecoration:'none',boxShadow:`0 8px 32px ${color}44` }}>
              Start Free Trial
            </Link>
            <Link href={`/${params.slug}/login`} style={{ display:'inline-flex',alignItems:'center',padding:'15px 28px',borderRadius:13,background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.8)',fontWeight:600,fontSize:15,textDecoration:'none',border:'1px solid rgba(255,255,255,0.12)' }}>
              Already registered? Login
            </Link>
            <Link href="/contact" style={{ display:'inline-flex',alignItems:'center',padding:'15px 28px',borderRadius:13,background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)',fontWeight:600,fontSize:15,textDecoration:'none',border:'1px solid rgba(255,255,255,0.12)' }}>
              Book a Demo
            </Link>
          </div>
          <p style={{ fontSize:13,color:'rgba(255,255,255,0.35)',marginTop:20 }}>14-day free trial - No credit card - HIPAA and DPDPA compliant - Go live in 7 days</p>
        </div>
      </section>

    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(PORTALS).map(slug => ({ slug }));
}
