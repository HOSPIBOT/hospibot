import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features -- HospiBot Healthcare OS',
  description: 'All HospiBot features: WhatsApp automation, EMR, billing, CRM, and more.',
};

const FEATURES = [
  { category:'WhatsApp Automation', color:'#25D366', bg:'#F0FDF4',
    items:[
      { icon:'💬', title:'AI Chatbot Receptionist', desc:'24/7 patient support — appointment booking, FAQs, department routing. Handles 80% of queries without staff.' },
      { icon:'📅', title:'Appointment Reminders', desc:'Automated reminders 24h and 2h before every appointment. Reduce no-shows by up to 60%.' },
      { icon:'📄', title:'Report Delivery', desc:'Lab and radiology reports sent instantly on WhatsApp as PDF with QR verification.' },
      { icon:'💳', title:'Payment Links', desc:'UPI payment links delivered on WhatsApp. Patients pay in one tap. Collections accelerate 3x.' },
      { icon:'🔄', title:'Refill Reminders', desc:'Chronic medication patients get WhatsApp reminders before they run out. One-tap reorder.' },
      { icon:'📣', title:'Broadcast Campaigns', desc:'Seasonal health drives, health camps, new service announcements -- sent to segmented patient lists.' },
    ],
  },
  { category:'Clinical & Operations', color:'#0D7C66', bg:'#ECFDF5',
    items:[
      { icon:'📋', title:'Electronic Medical Records', desc:'Structured EMR with voice dictation, prescription writing, drug interaction alerts, and ABHA integration.' },
      { icon:'🛏️', title:'IPD & Bed Management', desc:'Real-time bed occupancy, ward rounds, nurse notes, and automated discharge summaries.' },
      { icon:'🔬', title:'Lab Integration', desc:'Test ordering, sample tracking, result entry with reference ranges, and critical value alerts.' },
      { icon:'🏥', title:'OT Scheduling', desc:'Operation theatre planning, WHO surgical checklist, team assignment, and status flow.' },
      { icon:'💉', title:'Vaccination Tracker', desc:'National immunisation schedule, due date alerts, and family vaccination history.' },
      { icon:'🩺', title:'Telemedicine', desc:'Jitsi Meet video consultations, WhatsApp link delivery, and integrated clinical notes.' },
    ],
  },
  { category:'Billing & Finance', color:'#1E3A5F', bg:'#EFF6FF',
    items:[
      { icon:'🧾', title:'GST-Compliant Billing', desc:'HSN-mapped invoices, GSTR-1 export, e-way bills, and digital receipts -- fully compliant.' },
      { icon:'🏦', title:'Razorpay & UPI', desc:'One-click payment links via WhatsApp. All Indian payment modes: UPI, cards, netbanking, wallets.' },
      { icon:'🛡️', title:'TPA & Insurance', desc:'Pre-authorization, cashless claim submission, denial management, and settlement tracking.' },
      { icon:'📊', title:'Revenue Analytics', desc:'Daily revenue, collection efficiency, pending dues, doctor-wise billing, and MIS reports.' },
      { icon:'💊', title:'Pharmacy Billing', desc:'HSN-mapped dispensing, batch tracking, FIFO, and supplier reconciliation.' },
      { icon:'🔖', title:'Subscription Billing', desc:'Wellness memberships, AMC contracts, and package billing with auto-renewal.' },
    ],
  },
  { category:'CRM & Growth', color:'#B45309', bg:'#FFFBEB',
    items:[
      { icon:'📈', title:'Lead Management', desc:'Auto-capture leads from WhatsApp, website, and referrals into a visual CRM pipeline.' },
      { icon:'🎯', title:'Recurring Revenue Engine', desc:'Protocol-based follow-up automation. Reactivation campaigns. Turn single visits into lifetime patients.' },
      { icon:'🔁', title:'A/B Testing', desc:'Test WhatsApp message variations. Track open rates and conversion. Optimise automatically.' },
      { icon:'⭐', title:'NPS & Feedback', desc:'Post-visit feedback via WhatsApp. NPS scores tracked per doctor, department, and facility.' },
      { icon:'👥', title:'Referral Programs', desc:'Patient referral tracking, reward management, and automated thank-you messages.' },
      { icon:'📉', title:'Churn Prevention', desc:'AI detects patients who are drifting. Automated re-engagement campaigns bring them back.' },
    ],
  },
  { category:'Security & Compliance', color:'#6D28D9', bg:'#F5F3FF',
    items:[
      { icon:'🔒', title:'HIPAA & DPDPA Ready', desc:'Data encryption at rest and in transit. Consent management. Patient data never shared without permission.' },
      { icon:'🆔', title:'ABHA / ABDM Integration', desc:'Ayushman Bharat Health Account creation and FHIR-compliant health record exchange.' },
      { icon:'👁️', title:'Role-Based Access', desc:'Granular permissions per user role. Doctors, nurses, billing staff, admin -- each see only what they need.' },
      { icon:'📝', title:'Audit Trails', desc:'Every action logged with user, timestamp, and IP. Complete audit trail for compliance.' },
      { icon:'🏷️', title:'Multi-Tenant Isolation', desc:'Your patient data is completely isolated from other tenants. Zero cross-contamination risk.' },
      { icon:'🛡️', title:'2FA & Session Control', desc:'Two-factor authentication, session timeout, and suspicious login detection built in.' },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", background:'#F8FAFC' }}>

      {/* Hero */}
      <section style={{ background:'linear-gradient(160deg,#0A1628 0%,#0F2744 100%)', padding:'80px clamp(20px,5vw,80px) 64px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'48px 48px',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:'-20%',right:0,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,124,102,0.15) 0%,transparent 70%)',filter:'blur(50px)',pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center', position:'relative' }}>
          <div style={{ display:'inline-block',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.25)',borderRadius:99,padding:'5px 16px',fontSize:12.5,fontWeight:700,color:'#25D366',marginBottom:20,letterSpacing:'0.06em' }}>
            232 API ENDPOINTS -- 30 MODULES
          </div>
          <h1 style={{ fontSize:'clamp(28px,4vw,52px)',fontWeight:900,color:'#fff',marginBottom:16,letterSpacing:'-0.02em',lineHeight:1.15 }}>
            Every feature your healthcare<br/>business needs
          </h1>
          <p style={{ fontSize:'clamp(15px,1.5vw,17px)',color:'rgba(255,255,255,0.6)',maxWidth:560,margin:'0 auto 36px',lineHeight:1.75 }}>
            From WhatsApp automation to GST billing, clinical records to patient engagement -- everything is built in, connected, and ready from day one.
          </p>
          <div style={{ display:'flex',gap:28,justifyContent:'center',flexWrap:'wrap' }}>
            {['30+ modules','232 API endpoints','9 portal types','153 built-in pages'].map(stat => (
              <div key={stat} style={{ textAlign:'center' }}>
                <div style={{ fontSize:13,fontWeight:700,color:'#25D366' }}>{stat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature categories */}
      {FEATURES.map((cat, ci) => (
        <section key={cat.category} style={{ padding:'64px clamp(20px,5vw,80px)', background: ci%2===0 ? '#fff' : '#F8FAFC' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:36 }}>
              <div style={{ height:3,width:32,borderRadius:99,background:cat.color }}/>
              <h2 style={{ fontSize:'clamp(20px,2.5vw,30px)',fontWeight:800,color:'#0F172A',letterSpacing:'-0.02em' }}>{cat.category}</h2>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:18 }}>
              {cat.items.map(f => (
                <div key={f.title} style={{ background:'#fff',borderRadius:16,padding:'22px 20px',border:`1px solid ${cat.bg}`,boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                    <div style={{ width:40,height:40,borderRadius:11,background:cat.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0 }}>{f.icon}</div>
                    <h3 style={{ fontSize:14.5,fontWeight:700,color:'#0F172A',lineHeight:1.3 }}>{f.title}</h3>
                  </div>
                  <p style={{ fontSize:13,color:'#64748B',lineHeight:1.65,marginLeft:52 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section style={{ background:'#0F172A',padding:'64px clamp(20px,5vw,80px)',textAlign:'center' }}>
        <h2 style={{ fontSize:'clamp(22px,3vw,36px)',fontWeight:800,color:'#fff',marginBottom:12 }}>All features. One platform. One price.</h2>
        <p style={{ fontSize:15.5,color:'rgba(255,255,255,0.5)',marginBottom:28,maxWidth:480,margin:'0 auto 28px' }}>Start your 14-day free trial today. No credit card required.</p>
        <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
          <Link href="/register" style={{ padding:'13px 28px',borderRadius:12,background:'linear-gradient(135deg,#0D7C66,#047857)',color:'#fff',fontWeight:700,fontSize:15,textDecoration:'none' }}>Start Free Trial</Link>
          <Link href="/solutions" style={{ padding:'13px 28px',borderRadius:12,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.8)',fontWeight:600,fontSize:15,textDecoration:'none',border:'1px solid rgba(255,255,255,0.12)' }}>View Solutions</Link>
        </div>
      </section>
    </div>
  );
}
