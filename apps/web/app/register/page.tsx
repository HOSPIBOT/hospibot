'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const PORTALS = [
  { slug:'clinical',   name:'Clinical Portal',       icon:'🩺', color:'#0D7C66', dark:'#065F46', light:'#ECFDF5', border:'#6EE7B7', desc:'Hospitals · Clinics · Specialists · AYUSH',    count:86 },
  { slug:'diagnostic', name:'Diagnostic Portal',     icon:'🔬', color:'#1E40AF', dark:'#1E3A8A', light:'#EFF6FF', border:'#93C5FD', desc:'Pathology · Radiology · PCR · Home Collection', count:20 },
  { slug:'pharmacy',   name:'Pharmacy Portal',       icon:'💊', color:'#15803D', dark:'#14532D', light:'#F0FDF4', border:'#86EFAC', desc:'Retail · Online · Hospital · Wholesale',        count:14 },
  { slug:'homecare',   name:'Home Care Portal',      icon:'🏠', color:'#B45309', dark:'#92400E', light:'#FFFBEB', border:'#FCD34D', desc:'Nursing · Physio · Elder Care · Ambulance',     count:16 },
  { slug:'equipment',  name:'Equipment Portal',      icon:'⚙️', color:'#6D28D9', dark:'#5B21B6', light:'#F5F3FF', border:'#C4B5FD', desc:'Devices · Imaging · Surgical · Consumables',   count:18 },
  { slug:'wellness',   name:'Wellness Portal',       icon:'💆', color:'#BE185D', dark:'#9D174D', light:'#FFF1F2', border:'#FDA4AF', desc:'Fitness · Yoga · Nutrition · Holistic Health', count:18 },
  { slug:'services',   name:'Services Portal',       icon:'🤝', color:'#0369A1', dark:'#0C4A6E', light:'#F0F9FF', border:'#7DD3FC', desc:'Staffing · Billing · TPA · Consultancy',       count:20 },
];

const TRUST = [
  { icon:'🔒', text:'HIPAA & DPDPA Compliant' },
  { icon:'🏥', text:'1,000+ Healthcare Providers' },
  { icon:'⚡', text:'Go live in under 7 days' },
  { icon:'🇮🇳', text:'Built for Indian Healthcare' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const portal = PORTALS.find(p => p.slug === selected);

  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", minHeight:'100vh', display:'flex', flexDirection:'column', background:'#F8FAFC' }}>

      {/* TOP NAV */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'0 32px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#0D7C66,#25D366)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:16 }}>H</div>
          <span style={{ fontWeight:800, fontSize:17, color:'#0F172A', letterSpacing:'-0.02em' }}>Hospi<span style={{ color:'#0D7C66' }}>Bot</span></span>
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:16, fontSize:13, color:'#64748B' }}>
          <span>Already have an account?</span>
          <a href="/auth/login" style={{ fontWeight:700, color:'#0D7C66', textDecoration:'none', padding:'6px 16px', border:'1.5px solid #0D7C66', borderRadius:8, transition:'all 0.2s' }}>Sign in</a>
        </div>
      </nav>

      <div style={{ flex:1, display:'flex', maxWidth:1200, margin:'0 auto', width:'100%', padding:'48px 24px', gap:48, alignItems:'flex-start' }}>

        {/* LEFT PANEL — Trust & Branding */}
        <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', gap:24, position:'sticky', top:80 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:'#0F172A', lineHeight:1.3, marginBottom:8 }}>
              India's most complete<br />
              <span style={{ color:'#0D7C66' }}>Healthcare OS</span>
            </div>
            <p style={{ fontSize:13.5, color:'#64748B', lineHeight:1.7 }}>
              Purpose-built portals for every type of healthcare provider — from solo doctors to 500-bed hospital chains.
            </p>
          </div>

          {/* Trust signals */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {TRUST.map(t => (
              <div key={t.text} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize:18 }}>{t.icon}</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{t.text}</span>
              </div>
            ))}
          </div>

          {/* Compliance badges */}
          <div style={{ padding:16, background:'linear-gradient(135deg,#F0FDF4,#ECFDF5)', border:'1px solid #BBF7D0', borderRadius:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Compliance & Security</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {['HIPAA','DPDPA','GDPR','NABH','ABDM','ISO 27001'].map(b => (
                <span key={b} style={{ fontSize:10.5, fontWeight:700, padding:'3px 8px', background:'#D1FAE5', color:'#065F46', borderRadius:6 }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div style={{ padding:16, background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:13, color:'#374151', lineHeight:1.65, fontStyle:'italic', marginBottom:10 }}>
              "HospiBot transformed our patient communication. WhatsApp appointment confirmations reduced no-shows by 60%."
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#0D7C66,#25D366)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:700 }}>D</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#0F172A' }}>Dr. Priya Sharma</div>
                <div style={{ fontSize:11, color:'#94A3B8' }}>Apollo Diagnostics, Hyderabad</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Portal Selection */}
        <div style={{ flex:1 }}>
          {/* Step indicator */}
          <div style={{ display:'flex', alignItems:'center', marginBottom:32 }}>
            {['Choose Portal','Select Type','Organisation','Account'].map((s, i) => (
              <div key={s} style={{ display:'flex', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
                    background: i===0 ? '#0D7C66' : '#F1F5F9',
                    color: i===0 ? '#fff' : '#94A3B8',
                    boxShadow: i===0 ? '0 0 0 4px #D1FAE5' : 'none' }}>
                    {i+1}
                  </div>
                  <span style={{ fontSize:12.5, fontWeight: i===0 ? 600 : 400, color: i===0 ? '#0F172A' : '#94A3B8', whiteSpace:'nowrap' }}>{s}</span>
                </div>
                {i<3 && <div style={{ width:32, height:1.5, background: '#E2E8F0', margin:'0 8px' }} />}
              </div>
            ))}
          </div>

          <h1 style={{ fontSize:26, fontWeight:800, color:'#0F172A', marginBottom:6, letterSpacing:'-0.02em' }}>Which portal fits your practice?</h1>
          <p style={{ fontSize:14, color:'#64748B', marginBottom:28, lineHeight:1.6 }}>
            Each portal is tailored with specialised features, templates and workflows for your specific type of healthcare organisation.
          </p>

          {/* Portal grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:32 }}>
            {PORTALS.map(p => {
              const active = selected === p.slug;
              return (
                <button key={p.slug} onClick={() => setSelected(p.slug)}
                  style={{
                    textAlign:'left', padding:'18px 16px', borderRadius:16, cursor:'pointer',
                    border: active ? `2px solid ${p.color}` : '1.5px solid #E2E8F0',
                    background: active ? `linear-gradient(145deg,${p.light},#fff)` : '#fff',
                    boxShadow: active ? `0 8px 24px ${p.color}22` : '0 1px 4px rgba(0,0,0,0.04)',
                    transform: active ? 'translateY(-3px)' : 'none',
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    position:'relative',
                  }}>
                  {active && (
                    <div style={{ position:'absolute', top:10, right:10, width:20, height:20, borderRadius:'50%', background:p.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:800 }}>✓</div>
                  )}
                  <div style={{ fontSize:28, marginBottom:10, display:'block' }}>{p.icon}</div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#0F172A', marginBottom:4, lineHeight:1.3 }}>{p.name}</div>
                  <div style={{ fontSize:11.5, color:'#64748B', lineHeight:1.55, marginBottom:8 }}>{p.desc}</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:20, background:p.light, color:p.color }}>
                    {p.count} types
                  </div>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:12 }}>
            <button onClick={() => selected && router.push('/register/'+selected)}
              disabled={!selected}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'14px 32px', borderRadius:14, border:'none', cursor: selected ? 'pointer' : 'not-allowed',
                background: selected ? `linear-gradient(135deg,${portal?.color},${portal?.dark})` : '#CBD5E1',
                color:'#fff', fontFamily:"'Poppins',sans-serif", fontSize:14.5, fontWeight:700,
                boxShadow: selected ? `0 8px 24px ${portal?.color}44` : 'none',
                transform: selected ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s',
              }}>
              {selected ? `Continue with ${portal?.name}` : 'Select a portal to continue'}
              {selected && <span style={{ fontSize:18 }}>→</span>}
            </button>
            <p style={{ fontSize:12, color:'#94A3B8' }}>14-day free trial · No credit card required · Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
