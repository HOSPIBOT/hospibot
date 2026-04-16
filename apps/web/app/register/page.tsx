'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, ArrowLeft, Send, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

/* ─── DATA ──────────────────────────────────────────────────────────────────── */
const PORTALS = [
  { slug:'clinical',   name:'Clinical',   fullName:'Clinical Portal',   icon:'🩺', color:'#0D7C66', dark:'#065F46', light:'#ECFDF5', desc:'Hospitals · Clinics · Doctors · Specialists', count:86 },
  { slug:'diagnostic', name:'Diagnostic', fullName:'Diagnostic Portal', icon:'🔬', color:'#1E40AF', dark:'#1E3A8A', light:'#EFF6FF', desc:'Pathology · Radiology · PCR · Imaging', count:20 },
  { slug:'pharmacy',   name:'Pharmacy',   fullName:'Pharmacy Portal',   icon:'💊', color:'#15803D', dark:'#14532D', light:'#F0FDF4', desc:'Retail · Online · Hospital · Wholesale', count:14 },
  { slug:'homecare',   name:'Home Care',  fullName:'Home Care Portal',  icon:'🏠', color:'#B45309', dark:'#92400E', light:'#FFFBEB', desc:'Nursing · Physio · Elder Care · Ambulance', count:16 },
  { slug:'equipment',  name:'Equipment',  fullName:'Equipment Portal',  icon:'⚙️', color:'#6D28D9', dark:'#5B21B6', light:'#F5F3FF', desc:'Devices · Imaging · Surgical · Consumables', count:18 },
  { slug:'wellness',   name:'Wellness',   fullName:'Wellness Portal',   icon:'💆', color:'#BE185D', dark:'#9D174D', light:'#FFF1F2', desc:'Fitness · Yoga · Nutrition · Holistic', count:18 },
  { slug:'services',   name:'Services',   fullName:'Services Portal',   icon:'🤝', color:'#0369A1', dark:'#0C4A6E', light:'#F0F9FF', desc:'Staffing · Billing · TPA · Consultancy', count:20 },
];

const SUBTYPES: Record<string,{slug:string;name:string;icon:string;desc:string;popular?:boolean}[]> = {
  clinical:[
    {slug:'individual-doctor',     name:'Individual Doctor / GP',        icon:'👨‍⚕️', desc:'Solo practitioners & general physicians',popular:true},
    {slug:'specialist-doctor',     name:'Specialist Doctor',             icon:'🩻', desc:'Cardiologist, neurologist, orthopaedic'},
    {slug:'multi-specialty-clinic',name:'Multi-Specialty Clinic',        icon:'🏥', desc:'2–10 doctor clinics, multiple specialties',popular:true},
    {slug:'polyclinic',            name:'Polyclinic',                    icon:'🏢', desc:'Large outpatient, multiple departments'},
    {slug:'nursing-home',          name:'Nursing Home (<30 beds)',        icon:'🛏️', desc:'Small inpatient with basic wards'},
    {slug:'hospital-mid',          name:'Hospital (30–200 beds)',         icon:'🏨', desc:'Mid-size with full OPD & IPD'},
    {slug:'hospital-large',        name:'Hospital (200+ beds)',           icon:'🏛️', desc:'Large & super-specialty hospitals',popular:true},
    {slug:'ivf-fertility',         name:'IVF / Fertility Center',         icon:'🧬', desc:'IVF, IUI, fertility & embryology'},
    {slug:'maternity-hospital',    name:'Maternity Hospital',             icon:'🤱', desc:'Birthing centers & gynecology'},
    {slug:'dental-clinic',         name:'Dental Clinic',                  icon:'🦷', desc:'Dental, orthodontic & maxillofacial',popular:true},
    {slug:'eye-center',            name:'Eye / Ophthalmology Center',     icon:'👁️', desc:'Cataract, retina, LASIK & optometry'},
    {slug:'dermatologist',         name:'Dermatologist',                  icon:'✨', desc:'Skin, hair & aesthetic clinics'},
    {slug:'physiotherapy',         name:'Physiotherapy Clinic',           icon:'🏃', desc:'Standalone physio & sports medicine'},
    {slug:'ayurveda',              name:'Ayurveda / AYUSH Clinic',        icon:'🌿', desc:'Ayurveda, Naturopathy, Homeopathy'},
    {slug:'psychiatry',            name:'Psychiatry / Mental Health',     icon:'🧠', desc:'Psychiatry, psychology & counselling'},
    {slug:'dialysis',              name:'Standalone Dialysis Center',     icon:'💧', desc:'Nephrology & dialysis'},
  ],
  diagnostic:[
    {slug:'pathology-lab',       name:'Pathology / Blood Test Lab',          icon:'🧪', desc:'Full-service pathology & haematology',popular:true},
    {slug:'sample-collection',   name:'Sample Collection Center (PSC)',      icon:'💉', desc:'Patient service center'},
    {slug:'home-collection',     name:'Home Sample Collection',              icon:'🏠', desc:'Phlebotomist-based home visits',popular:true},
    {slug:'radiology-center',    name:'Radiology Center (X-Ray, CT, MRI)',   icon:'📡', desc:'Diagnostic imaging & radiology',popular:true},
    {slug:'ultrasound-center',   name:'Ultrasound Center',                   icon:'📊', desc:'USG, Doppler & sonography'},
    {slug:'pet-scan',            name:'PET Scan Center',                     icon:'⚛️',  desc:'PET-CT & nuclear medicine'},
    {slug:'cardiac-diagnostics', name:'Cardiac Diagnostics',                 icon:'❤️', desc:'Echo, TMT, Holter & stress tests'},
    {slug:'molecular-lab',       name:'Molecular / PCR Lab',                 icon:'🔭', desc:'RT-PCR, NGS & molecular diagnostics'},
    {slug:'health-checkup',      name:'Health Checkup Center',               icon:'📋', desc:'Preventive health screening'},
    {slug:'corporate-screening', name:'Corporate Wellness Screening',        icon:'🏢', desc:'Bulk employee health camps'},
    {slug:'genetic-lab',         name:'Genetic Testing Lab',                 icon:'🧬', desc:'Chromosomal analysis & genetic testing'},
    {slug:'reference-lab',       name:'Reference / Central Lab',             icon:'🏭', desc:'Large central processing lab'},
    {slug:'tele-radiology',      name:'Tele-Radiology Service',              icon:'💻', desc:'Remote radiology reporting'},
  ],
  pharmacy:[
    {slug:'retail-pharmacy',      name:'Retail Medical Store / Chemist', icon:'🏪', desc:'OTC & prescription medicines',popular:true},
    {slug:'hospital-pharmacy',    name:'Hospital / Institutional Pharmacy',icon:'🏥',desc:'In-hospital dispensing'},
    {slug:'online-pharmacy',      name:'Online Pharmacy / Home Delivery',icon:'📦', desc:'E-pharmacy with delivery',popular:true},
    {slug:'generic-store',        name:'Jan Aushadhi Generic Store',     icon:'🟢', desc:'Government generic medicines'},
    {slug:'ayurvedic-store',      name:'Ayurvedic / Herbal Store',       icon:'🌿', desc:'AYUSH & traditional preparations'},
    {slug:'compounding-pharmacy', name:'Compounding Pharmacy',           icon:'⚗️', desc:'Custom medication formulations'},
    {slug:'oncology-pharmacy',    name:'Oncology Pharmacy',              icon:'🎗️', desc:'Chemotherapy & cytotoxic drugs'},
    {slug:'cold-chain-pharmacy',  name:'Cold Chain / Specialty Pharmacy',icon:'❄️', desc:'Biologics, insulin & vaccines'},
    {slug:'pharma-wholesale',     name:'Pharmaceutical Wholesale / Distributor',icon:'🚚',desc:'Bulk supply & distribution'},
  ],
  homecare:[
    {slug:'home-nursing',          name:'Home Nursing Services',          icon:'👩‍⚕️', desc:'Nurses for post-surgery & chronic care',popular:true},
    {slug:'home-physio',           name:'Home Physiotherapy',             icon:'🏃', desc:'Physio for ortho, neuro & geriatric',popular:true},
    {slug:'elder-care',            name:'Elder Care / Geriatric Support', icon:'👴', desc:'Daily assistance & medical monitoring'},
    {slug:'icu-at-home',           name:'ICU at Home',                    icon:'🏥', desc:'Critical care & ventilator support'},
    {slug:'mother-newborn',        name:'Mother & Newborn Care',          icon:'🤱', desc:'Postnatal & lactation support'},
    {slug:'emergency-ambulance',   name:'Emergency Ambulance Service',    icon:'🚑', desc:'BLS/ALS ambulance transport'},
    {slug:'patient-transport',     name:'Patient Transport',              icon:'🚐', desc:'Scheduled transport for dialysis/chemo'},
  ],
  equipment:[
    {slug:'diagnostic-imaging',    name:'Diagnostic Imaging Equipment',    icon:'📡', desc:'X-ray, MRI, CT & ultrasound systems',popular:true},
    {slug:'surgical-instruments',  name:'Surgical Instruments & OT',      icon:'🔬', desc:'Surgical tools, OT lights & tables'},
    {slug:'dental-equipment',      name:'Dental Equipment & Supplies',    icon:'🦷', desc:'Dental chairs & handpieces'},
    {slug:'lab-equipment',         name:'Lab Equipment & Analyser',       icon:'🧪', desc:'Auto-analysers & centrifuges'},
    {slug:'consumables',           name:'Medical Consumables & Disposables',icon:'📦',desc:'Syringes, cannulas & disposables',popular:true},
    {slug:'ot-icu-equipment',      name:'ICU / OT Critical Equipment',    icon:'❤️', desc:'Ventilators, monitors & defibrillators'},
  ],
  wellness:[
    {slug:'fitness-gym',     name:'Fitness Center / Gym',         icon:'💪', desc:'Gyms, CrossFit & cardio training',popular:true},
    {slug:'yoga-studio',     name:'Yoga Studio',                  icon:'🧘', desc:'Yoga, pranayama & meditation',popular:true},
    {slug:'nutrition-clinic',name:'Nutrition & Dietetics Clinic', icon:'🥗', desc:'Clinical dieticians & weight management'},
    {slug:'spa-wellness',    name:'Spa & Wellness Center',        icon:'💆', desc:'Massages & relaxation therapies'},
    {slug:'naturopathy',     name:'Naturopathy Center',           icon:'🌿', desc:'Hydrotherapy & natural healing'},
    {slug:'mental-wellness', name:'Mental Wellness Center',       icon:'🧠', desc:'Mindfulness & wellbeing coaching'},
  ],
  services:[
    {slug:'healthcare-staffing',  name:'Healthcare Staffing Agency',        icon:'👥', desc:'Nurses, doctors & paramedic placement',popular:true},
    {slug:'medical-billing',      name:'Medical Billing & Coding',          icon:'🧾', desc:'Billing outsourcing & TPA claims',popular:true},
    {slug:'tpa-insurance',        name:'TPA / Insurance Services',          icon:'🛡️', desc:'Third-party admin & health insurance'},
    {slug:'medical-tourism',      name:'Medical Tourism Facilitator',       icon:'✈️', desc:'International patient facilitation'},
    {slug:'hospital-consultancy', name:'Hospital Management Consultancy',   icon:'📊', desc:'Setup, accreditation & consulting'},
    {slug:'healthcare-it',        name:'Healthcare IT Implementation',      icon:'⚙️', desc:'HMS, EMR & health IT systems'},
  ],
};

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry'];

/* ─── STYLES ─────────────────────────────────────────────────────────────────── */
const S = {
  page: { fontFamily:"'Poppins',sans-serif", minHeight:'100vh', background:'#F0F4F8', display:'flex' as const, flexDirection:'column' as const },
  nav: { background:'#0F172A', padding:'0 32px', height:58, display:'flex' as const, alignItems:'center' as const, justifyContent:'space-between' as const, flexShrink:0 as const },
  body: { flex:1, display:'flex' as const, overflow:'hidden' as const, position:'relative' as const },
  slide: { flex:1, display:'flex' as const, flexDirection:'column' as const, alignItems:'center' as const, justifyContent:'flex-start' as const, padding:'48px 5vw 40px', overflowY:'auto' as const },
  h1: { fontSize:'clamp(22px,3vw,32px)', fontWeight:800, color:'#0F172A', marginBottom:8, letterSpacing:'-0.02em', textAlign:'center' as const },
  sub: { fontSize:'clamp(14px,1.5vw,16px)', color:'#64748B', textAlign:'center' as const, maxWidth:560, lineHeight:1.65, marginBottom:36 },
  card: (active:boolean, color:string, light:string) => ({
    border: `2px solid ${active ? color : '#E2E8F0'}`,
    background: active ? `linear-gradient(145deg,${light},#fff)` : '#fff',
    boxShadow: active ? `0 8px 28px ${color}25` : '0 2px 8px rgba(0,0,0,0.05)',
    transform: active ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
    transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    borderRadius: 18, cursor:'pointer', textAlign:'left' as const, padding:'18px 16px', position:'relative' as const,
  }),
};

/* ─── INPUT COMPONENT ────────────────────────────────────────────────────────── */
function Inp({ label, req, hint, children }: { label:string; req?:boolean; hint?:string; children:React.ReactNode }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase' as const, letterSpacing:'0.07em' }}>
        {label}{req && <span style={{ color:'#EF4444', marginLeft:3 }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize:11.5, color:'#94A3B8' }}>{hint}</span>}
    </div>
  );
}

function textInput(color: string, extra: object = {}) {
  return {
    width:'100%' as const, padding:'11px 14px', fontSize:15, borderRadius:10,
    border:'1.5px solid #E2E8F0', background:'#F8FAFC', outline:'none',
    fontFamily:"'Poppins',sans-serif", transition:'all 0.18s',
    boxSizing:'border-box' as const, color:'#0F172A', ...extra,
  };
}

/* ─── PROGRESS BAR ────────────────────────────────────────────────────────────── */
function ProgressBar({ step, total, color }: { step:number; total:number; color:string }) {
  return (
    <div style={{ width:'100%', maxWidth:520, height:4, background:'#E2E8F0', borderRadius:99, overflow:'hidden', marginBottom:40 }}>
      <div style={{ height:'100%', width:`${((step+1)/total)*100}%`, background:color, borderRadius:99, transition:'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState(0);      // 0=portal, 1=subtype, 2=org, 3=admin
  const [dir, setDir] = useState(1);        // 1=forward, -1=back
  const [portal, setPortal] = useState('');
  const [subtype, setSubtype] = useState('');
  const [search, setSearch] = useState('');
  const [showOthers, setShowOthers] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  const [org, setOrg] = useState({ name:'', slug:'', phone:'', email:'', address:'', city:'', state:'Telangana', pincode:'', gstNumber:'' });
  const [admin, setAdmin] = useState({ firstName:'', lastName:'', email:'', password:'' });

  const P = PORTALS.find(p => p.slug === portal);
  const color = P?.color || '#0D7C66';
  const dark  = P?.dark  || '#065F46';
  const light = P?.light || '#ECFDF5';

  const slugify = (n:string) => n.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-').slice(0,40);
  const oSet = (k:string) => (e:any) => setOrg(p => ({ ...p, [k]:e.target.value, ...(k==='name'?{slug:slugify(e.target.value)}:{}) }));
  const aSet = (k:string) => (e:any) => setAdmin(p => ({ ...p, [k]:e.target.value }));

  const focusIn  = (e:any) => { e.target.style.borderColor=color; e.target.style.background='#fff'; e.target.style.boxShadow=`0 0 0 3px ${color}20`; };
  const focusOut = (e:any) => { e.target.style.borderColor='#E2E8F0'; e.target.style.background='#F8FAFC'; e.target.style.boxShadow='none'; };

  function goTo(n: number) {
    setDir(n > step ? 1 : -1);
    setStep(n);
    setTimeout(() => slideRef.current?.scrollTo({ top:0, behavior:'smooth' }), 50);
  }

  function pickPortal(slug: string) {
    setPortal(slug);
    setSubtype('');
    setSearch('');
    setShowOthers(false);
    setTimeout(() => goTo(1), 280);
  }

  function pickSubtype(slug: string) {
    if (slug === '__others__') { setShowOthers(true); return; }
    setSubtype(slug);
    setTimeout(() => goTo(2), 280);
  }

  const subtypeList = (SUBTYPES[portal] || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.desc.toLowerCase().includes(search.toLowerCase())
  );

  const typeName = (SUBTYPES[portal] || []).find(s => s.slug === subtype)?.name || subtype.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());

  async function handleSubmit() {
    if (!admin.firstName || !admin.email || !admin.password) { toast.error('Please fill all required fields'); return; }
    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        name: org.name, slug: org.slug, phone: org.phone, email: org.email || admin.email,
        address: org.address, city: org.city, state: org.state, country:'India',
        pincode: org.pincode, gstNumber: org.gstNumber,
        adminFirstName: admin.firstName, adminLastName: admin.lastName,
        adminEmail: admin.email, adminPassword: admin.password,
        plan:'STARTER', portalFamily: portal, subTypeSlug: subtype,
      });
      setSuccess(true);
    } catch (err:any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setSubmitting(false); }
  }

  /* ── SUCCESS ──────────────────────────────────────────────────────────────── */
  if (success) return (
    <div style={{ ...S.page, alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${light},#fff)` }}>
      <div style={{ background:'#fff', borderRadius:24, padding:52, textAlign:'center', maxWidth:440, width:'90%', boxShadow:`0 24px 80px ${color}20`, border:`1px solid ${color}20` }}>
        <div style={{ width:76, height:76, borderRadius:'50%', background:light, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <CheckCircle2 size={38} color={color} />
        </div>
        <div style={{ fontSize:36, marginBottom:10 }}>🎉</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:'#0F172A', marginBottom:8 }}>You're all set!</h2>
        <p style={{ fontSize:15, color:'#64748B', lineHeight:1.7, marginBottom:6 }}>
          <strong>{org.name}</strong> is registered on the <strong>{P?.fullName}</strong>.
        </p>
        <p style={{ fontSize:13, color:'#94A3B8', marginBottom:32 }}>Your 14-day free trial has started. No credit card needed.</p>
        <button onClick={() => router.push(`/${portal}/login`)} style={{ width:'100%', padding:15, borderRadius:14, border:'none', background:`linear-gradient(135deg,${color},${dark})`, color:'#fff', fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:`0 8px 28px ${color}44`, marginBottom:10 }}>
          Sign in to {P?.fullName} →
        </button>
        <p style={{ fontSize:12, color:'#94A3B8' }}>Use the email & password you just created</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#0D7C66,#25D366)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:16 }}>H</div>
          <span style={{ fontWeight:800, fontSize:17, color:'#fff', letterSpacing:'-0.02em' }}>Hospi<span style={{ color:'#25D366' }}>Bot</span></span>
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {step > 0 && (
            <button onClick={() => goTo(step - 1)} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Step {step + 1} of 4</span>
          <a href="/auth/login" style={{ fontSize:13, color:'rgba(255,255,255,0.6)', textDecoration:'none' }}>Sign in</a>
        </div>
      </nav>

      <div style={S.body}>
        <div ref={slideRef} style={{ ...S.slide, animationName: dir > 0 ? 'slideIn' : 'slideInBack', animationDuration:'0.35s', animationFillMode:'both' as const }}>

          {/* ── STEP 0: Choose Portal ──────────────────────────────────── */}
          {step === 0 && (<>
            <ProgressBar step={0} total={4} color="#0D7C66" />
            <h1 style={S.h1}>Which portal fits your practice?</h1>
            <p style={S.sub}>HospiBot has a dedicated portal for every type of healthcare provider. Click to select yours.</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, width:'100%', maxWidth:900 }}>
              {PORTALS.map(p => (
                <button key={p.slug} onClick={() => pickPortal(p.slug)} style={S.card(portal===p.slug, p.color, p.light)}>
                  {portal===p.slug && <div style={{ position:'absolute', top:10, right:10, width:22, height:22, borderRadius:'50%', background:p.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:800 }}>✓</div>}
                  <div style={{ fontSize:30, marginBottom:10 }}>{p.icon}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:4, lineHeight:1.3 }}>{p.fullName}</div>
                  <div style={{ fontSize:12.5, color:'#64748B', lineHeight:1.55, marginBottom:10 }}>{p.desc}</div>
                  <div style={{ fontSize:11.5, fontWeight:700, padding:'3px 10px', borderRadius:20, background:p.light, color:p.color, display:'inline-block' }}>{p.count} types</div>
                </button>
              ))}
            </div>
            <p style={{ fontSize:13, color:'#94A3B8', marginTop:28 }}>Click any card to proceed automatically</p>
          </>)}

          {/* ── STEP 1: Choose Subtype ─────────────────────────────────── */}
          {step === 1 && P && (<>
            <ProgressBar step={1} total={4} color={color} />
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${color},${dark})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{P.icon}</div>
              <span style={{ fontSize:17, fontWeight:700, color:'#0F172A' }}>{P.fullName}</span>
            </div>
            <h1 style={{ ...S.h1, marginBottom:6 }}>What best describes your practice?</h1>
            <p style={{ ...S.sub, marginBottom:22 }}>This tailors your features, templates and automations. Click to auto-advance.</p>

            {!showOthers ? (<>
              {/* Search */}
              <div style={{ position:'relative', width:'100%', maxWidth:480, marginBottom:24 }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'#94A3B8' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search practice types…"
                  style={{ width:'100%', paddingLeft:42, paddingRight:16, paddingTop:12, paddingBottom:12, fontSize:15, borderRadius:12, border:'1.5px solid #E2E8F0', background:'#fff', outline:'none', fontFamily:"'Poppins',sans-serif", boxSizing:'border-box' as const }}
                  onFocus={e => { e.target.style.borderColor=color; e.target.style.boxShadow=`0 0 0 3px ${color}18`; }}
                  onBlur={e => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:12, width:'100%', maxWidth:900 }}>
                {subtypeList.map(s => (
                  <button key={s.slug} onClick={() => pickSubtype(s.slug)} style={{ ...S.card(subtype===s.slug, color, light), padding:'14px 14px' }}>
                    {s.popular && subtype!==s.slug && <span style={{ position:'absolute', top:8, right:8, fontSize:9, fontWeight:700, background:'#FEF3C7', color:'#92400E', padding:'2px 7px', borderRadius:20 }}>POPULAR</span>}
                    {subtype===s.slug && <div style={{ position:'absolute', top:8, right:8, width:20, height:20, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:800 }}>✓</div>}
                    <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
                    <div style={{ fontSize:13.5, fontWeight:700, color:'#0F172A', lineHeight:1.35, marginBottom:4, paddingRight:s.popular?20:0 }}>{s.name}</div>
                    <div style={{ fontSize:12, color:'#64748B', lineHeight:1.5 }}>{s.desc}</div>
                  </button>
                ))}

                {/* Others card */}
                <button onClick={() => pickSubtype('__others__')} style={{ ...S.card(false,'#64748B','#F8FAFC'), padding:'14px 14px', border:'1.5px dashed #CBD5E1' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>❓</div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#475569', marginBottom:4 }}>Others / Not Listed</div>
                  <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.5 }}>Don't see your practice type? Let us know.</div>
                </button>
              </div>
            </>) : (
              /* ── OTHERS PANEL ──────────────────────────────────────────── */
              <div style={{ width:'100%', maxWidth:520 }}>
                <div style={{ background:'#fff', borderRadius:20, border:'1px solid #E2E8F0', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div style={{ padding:'24px 28px', background:`linear-gradient(135deg,${color},${dark})`, color:'#fff' }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>🙋</div>
                    <h3 style={{ fontSize:19, fontWeight:800, margin:'0 0 6px' }}>Your subtype isn't listed yet</h3>
                    <p style={{ fontSize:14, opacity:0.85, margin:0, lineHeight:1.6 }}>
                      We're adding new subtypes regularly. Share your details and our team will contact you within 24 hours to add your category and get you onboarded.
                    </p>
                  </div>
                  {!contactSent ? (
                    <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>
                      <Inp label="Your Name" req>
                        <input placeholder="Dr. Priya Sharma" style={textInput(color)} onFocus={focusIn} onBlur={focusOut}
                          onChange={e => setContactMsg(e.target.value.split('|')[0]+'|'+(contactMsg.split('|')[1]||''))} />
                      </Inp>
                      <Inp label="WhatsApp / Phone" req>
                        <input placeholder="+91 9876543210" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                          style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
                      </Inp>
                      <Inp label="Describe your practice type" req hint="e.g. Stem Cell Therapy Center, Proton Therapy, etc.">
                        <textarea placeholder="Tell us about your practice and what you need…" rows={3}
                          style={{ ...textInput(color), resize:'vertical' as const }}
                          onFocus={focusIn} onBlur={focusOut}
                          onChange={e => setContactMsg(e.target.value)} />
                      </Inp>
                      <div style={{ display:'flex', gap:10, paddingTop:4 }}>
                        <button onClick={() => setShowOthers(false)} style={{ flex:'0 0 auto', padding:'11px 18px', borderRadius:12, border:'1.5px solid #E2E8F0', background:'#fff', fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer', color:'#475569' }}>
                          ← Back
                        </button>
                        <button onClick={() => { if (!contactPhone) { toast.error('Please enter your phone number'); return; } setContactSent(true); }}
                          style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${color},${dark})`, color:'#fff', fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                          <Send size={15} /> Notify Me When Added
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding:'32px 28px', textAlign:'center' }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
                      <h3 style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:8 }}>Got it! We'll reach out soon.</h3>
                      <p style={{ fontSize:14, color:'#64748B', lineHeight:1.65, marginBottom:20 }}>
                        Our team will contact you on <strong>{contactPhone}</strong> within 24 hours to add your subtype and complete your onboarding.
                      </p>
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', background:'#F0FDF4', borderRadius:12, border:'1px solid #BBF7D0', marginBottom:20 }}>
                        <Phone size={18} color="#15803D" />
                        <div style={{ textAlign:'left' }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'#15803D' }}>Admin Contact</div>
                          <div style={{ fontSize:13, color:'#374151' }}>admin@hospibot.in · +91 90000 00000</div>
                        </div>
                      </div>
                      <a href="/" style={{ fontSize:14, color:color, textDecoration:'none', fontWeight:600 }}>← Return to HospiBot home</a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>)}

          {/* ── STEP 2: Organisation Details ───────────────────────────── */}
          {step === 2 && P && (<>
            <ProgressBar step={2} total={4} color={color} />
            <h1 style={{ ...S.h1, marginBottom:6 }}>Tell us about your organisation</h1>
            <p style={{ ...S.sub, marginBottom:28 }}>This information sets up your portal account and will appear on patient records.</p>
            <div style={{ width:'100%', maxWidth:640, background:'#fff', borderRadius:20, border:'1px solid #E2E8F0', padding:'32px 36px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', gap:20 }}>
              <Inp label="Organisation Name" req>
                <input value={org.name} onChange={oSet('name')} placeholder="e.g. Apollo Diagnostics Hyderabad"
                  style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
              </Inp>
              <Inp label="Portal URL (unique address)" req hint="Cannot be changed after registration">
                <div style={{ display:'flex', borderRadius:10, border:'1.5px solid #E2E8F0', overflow:'hidden', background:'#F8FAFC' }}>
                  <span style={{ padding:'11px 12px', background:'#F1F5F9', borderRight:'1px solid #E2E8F0', fontSize:13.5, color:'#64748B', fontFamily:"'Poppins',sans-serif", whiteSpace:'nowrap' as const, display:'flex', alignItems:'center' }}>hospibot.in/</span>
                  <input value={org.slug} onChange={oSet('slug')} placeholder="apollo-diagnostics-hyd"
                    style={{ flex:1, padding:'11px 14px', fontSize:14, border:'none', background:'transparent', outline:'none', fontFamily:"'Poppins',sans-serif", color:'#0F172A' }} />
                </div>
              </Inp>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <Inp label="Phone Number" req>
                  <input value={org.phone} onChange={oSet('phone')} placeholder="+91 98765 43210"
                    style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
                </Inp>
                <Inp label="Organisation Email">
                  <input type="email" value={org.email} onChange={oSet('email')} placeholder="info@yourorg.com"
                    style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
                </Inp>
              </div>
              <Inp label="Street Address">
                <input value={org.address} onChange={oSet('address')} placeholder="Building, street, area"
                  style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
              </Inp>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                <Inp label="City" req>
                  <input value={org.city} onChange={oSet('city')} placeholder="Hyderabad"
                    style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
                </Inp>
                <Inp label="State" req>
                  <select value={org.state} onChange={oSet('state')} style={{ ...textInput(color), cursor:'pointer' }} onFocus={focusIn} onBlur={focusOut}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Inp>
                <Inp label="Pincode">
                  <input value={org.pincode} onChange={oSet('pincode')} placeholder="500001"
                    style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
                </Inp>
              </div>
              <Inp label="GST Number" hint="Optional — can be added later">
                <input value={org.gstNumber} onChange={oSet('gstNumber')} placeholder="29AAAAA0000A1Z5"
                  style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
              </Inp>
              <button onClick={() => { if (!org.name||!org.phone||!org.city){toast.error('Please fill Name, Phone & City');return;} goTo(3); }}
                style={{ marginTop:8, padding:'14px', borderRadius:13, border:'none', background:`linear-gradient(135deg,${color},${dark})`, color:'#fff', fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:`0 6px 20px ${color}40` }}>
                Continue →
              </button>
            </div>
          </>)}

          {/* ── STEP 3: Admin Account ─────────────────────────────────── */}
          {step === 3 && P && (<>
            <ProgressBar step={3} total={4} color={color} />
            <h1 style={{ ...S.h1, marginBottom:6 }}>Create your admin account</h1>
            <p style={{ ...S.sub, marginBottom:28 }}>This is the primary login for your {P.fullName}.</p>
            <div style={{ width:'100%', maxWidth:560, background:'#fff', borderRadius:20, border:'1px solid #E2E8F0', padding:'32px 36px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <Inp label="First Name" req>
                  <input value={admin.firstName} onChange={aSet('firstName')} placeholder="Vinod"
                    style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
                </Inp>
                <Inp label="Last Name">
                  <input value={admin.lastName} onChange={aSet('lastName')} placeholder="Kumar"
                    style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
                </Inp>
              </div>
              <Inp label="Admin Email" req>
                <input type="email" value={admin.email} onChange={aSet('email')} placeholder="admin@yourorg.com"
                  style={textInput(color)} onFocus={focusIn} onBlur={focusOut} />
              </Inp>
              <Inp label="Password" req>
                <div style={{ position:'relative' }}>
                  <input type={showPwd?'text':'password'} value={admin.password} onChange={aSet('password')} placeholder="Minimum 8 characters"
                    style={{ ...textInput(color), paddingRight:44 }} onFocus={focusIn} onBlur={focusOut} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex', padding:0 }}>
                    {showPwd ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </div>
              </Inp>

              {/* Summary */}
              <div style={{ padding:'16px 18px', background:'#F8FAFC', borderRadius:14, border:'1px solid #E2E8F0' }}>
                <div style={{ fontSize:11.5, fontWeight:700, color:'#94A3B8', textTransform:'uppercase' as const, letterSpacing:'0.07em', marginBottom:12 }}>Registration Summary</div>
                {[['Portal', P.fullName],['Type', typeName],['Organisation', org.name||'—'],['City', org.city||'—'],['Plan','14-day Free Trial']].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F1F5F9' }}>
                    <span style={{ fontSize:13.5, color:'#64748B' }}>{k}</span>
                    <span style={{ fontSize:13.5, fontWeight:600, color: k==='Plan' ? color : '#0F172A' }}>{v}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding:'14px', borderRadius:13, border:'none', background: submitting ? '#CBD5E1' : `linear-gradient(135deg,${color},${dark})`, color:'#fff', fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:700, cursor: submitting ? 'not-allowed':'pointer', boxShadow: submitting ? 'none' : `0 6px 20px ${color}40`, transition:'all 0.2s' }}>
                {submitting ? 'Creating your account…' : 'Create Account & Start Free Trial →'}
              </button>
              <p style={{ fontSize:12.5, color:'#94A3B8', textAlign:'center' as const, margin:0 }}>
                By registering you agree to our <span style={{ textDecoration:'underline', cursor:'pointer' }}>Terms</span> &amp; <span style={{ textDecoration:'underline', cursor:'pointer' }}>Privacy Policy</span>
              </p>
            </div>
          </>)}

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInBack { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        * { box-sizing: border-box; }
        button:focus { outline:none; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
      `}</style>
    </div>
  );
}
