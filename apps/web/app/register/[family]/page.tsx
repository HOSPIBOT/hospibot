'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const META: Record<string,{name:string;color:string;dark:string;light:string;border:string;icon:string;tagline:string}> = {
  clinical:  {name:'Clinical Portal',   color:'#0D7C66',dark:'#065F46',light:'#ECFDF5',border:'#6EE7B7',icon:'🩺',tagline:'For hospitals, clinics, doctors & specialists'},
  diagnostic:{name:'Diagnostic Portal', color:'#1E40AF',dark:'#1E3A8A',light:'#EFF6FF',border:'#93C5FD',icon:'🔬',tagline:'For pathology labs, radiology & diagnostic centers'},
  pharmacy:  {name:'Pharmacy Portal',   color:'#15803D',dark:'#14532D',light:'#F0FDF4',border:'#86EFAC',icon:'💊',tagline:'For retail, hospital & online pharmacies'},
  homecare:  {name:'Home Care Portal',  color:'#B45309',dark:'#92400E',light:'#FFFBEB',border:'#FCD34D',icon:'🏠',tagline:'For home nursing, elder care & ambulance services'},
  equipment: {name:'Equipment Portal',  color:'#6D28D9',dark:'#5B21B6',light:'#F5F3FF',border:'#C4B5FD',icon:'⚙️',tagline:'For medical device suppliers & distributors'},
  wellness:  {name:'Wellness Portal',   color:'#BE185D',dark:'#9D174D',light:'#FFF1F2',border:'#FDA4AF',icon:'💆',tagline:'For fitness, yoga, nutrition & wellness centers'},
  services:  {name:'Services Portal',   color:'#0369A1',dark:'#0C4A6E',light:'#F0F9FF',border:'#7DD3FC',icon:'🤝',tagline:'For staffing, billing & healthcare support services'},
};

const FALLBACK: Record<string,{slug:string;name:string;icon:string;desc:string;popular?:boolean}[]> = {
  clinical:[
    {slug:'individual-doctor',name:'Individual Doctor / GP',icon:'👨‍⚕️',desc:'Solo practitioners, general physicians & family medicine',popular:true},
    {slug:'specialist-doctor',name:'Specialist Doctor',icon:'🩻',desc:'Cardiologists, neurologists, orthopaedics & all specialists'},
    {slug:'multi-specialty-clinic',name:'Multi-Specialty Clinic',icon:'🏥',desc:'2–10 doctor clinics with multiple specialties',popular:true},
    {slug:'polyclinic',name:'Polyclinic',icon:'🏢',desc:'Large outpatient facilities with multiple departments'},
    {slug:'nursing-home',name:'Nursing Home (<30 beds)',icon:'🛏️',desc:'Small inpatient facilities with basic wards'},
    {slug:'hospital-mid',name:'Hospital (30–200 beds)',icon:'🏨',desc:'Mid-size hospitals with full OPD & IPD'},
    {slug:'hospital-large',name:'Hospital (200+ beds)',icon:'🏛️',desc:'Large multi-specialty & super-specialty hospitals',popular:true},
    {slug:'ivf-fertility',name:'IVF / Fertility Center',icon:'🧬',desc:'IVF, IUI, fertility treatments & embryology'},
    {slug:'maternity-hospital',name:'Maternity Hospital',icon:'🤱',desc:'Birthing centers, maternity & gynecology'},
    {slug:'dental-clinic',name:'Dental Clinic',icon:'🦷',desc:'Dental, orthodontic & maxillofacial practices',popular:true},
    {slug:'eye-center',name:'Eye / Ophthalmology Center',icon:'👁️',desc:'Cataract, retina, LASIK & optometry'},
    {slug:'dermatologist',name:'Dermatologist / Cosmetologist',icon:'✨',desc:'Skin, hair, cosmetic & aesthetic clinics'},
    {slug:'physiotherapy',name:'Physiotherapy Clinic',icon:'🏃',desc:'Standalone physio, rehab & sports medicine'},
    {slug:'ayurveda',name:'Ayurveda / AYUSH Clinic',icon:'🌿',desc:'Ayurveda, Naturopathy, Homeopathy & traditional medicine'},
    {slug:'psychiatry',name:'Psychiatry / Mental Health',icon:'🧠',desc:'Psychiatry, psychology, counselling & de-addiction'},
    {slug:'dialysis',name:'Standalone Dialysis Center',icon:'💧',desc:'Nephrology & dialysis facilities'},
  ],
  diagnostic:[
    {slug:'pathology-lab',name:'Pathology / Blood Test Lab',icon:'🧪',desc:'Full-service pathology & haematology lab',popular:true},
    {slug:'sample-collection',name:'Sample Collection Center (PSC)',icon:'💉',desc:'Patient service center for sample collection'},
    {slug:'home-collection',name:'Home Sample Collection',icon:'🏠',desc:'Phlebotomist-based home collection service',popular:true},
    {slug:'radiology-center',name:'Radiology Center (X-Ray, CT, MRI)',icon:'📡',desc:'Diagnostic imaging and radiology',popular:true},
    {slug:'ultrasound-center',name:'Ultrasound Center',icon:'📊',desc:'USG, Doppler & sonography services'},
    {slug:'pet-scan',name:'PET Scan Center',icon:'⚛️',desc:'PET-CT and nuclear medicine imaging'},
    {slug:'cardiac-diagnostics',name:'Cardiac Diagnostics',icon:'❤️',desc:'Echo, TMT, Holter & cardiac stress tests'},
    {slug:'molecular-lab',name:'Molecular / PCR Lab',icon:'🔭',desc:'RT-PCR, NGS & molecular diagnostics'},
    {slug:'health-checkup',name:'Health Checkup Center',icon:'📋',desc:'Preventive health screening packages'},
    {slug:'corporate-screening',name:'Corporate Wellness Screening',icon:'🏢',desc:'Bulk employee health camps & screening'},
    {slug:'genetic-lab',name:'Genetic Testing Lab',icon:'🧬',desc:'Chromosomal analysis & genetic testing'},
    {slug:'reference-lab',name:'Reference / Central Lab',icon:'🏭',desc:'Large central processing & reference lab'},
    {slug:'tele-radiology',name:'Tele-Radiology Service',icon:'💻',desc:'Remote radiology reporting & teleradiology'},
  ],
  pharmacy:[
    {slug:'retail-pharmacy',name:'Retail Medical Store / Chemist',icon:'🏪',desc:'OTC and prescription medicines',popular:true},
    {slug:'hospital-pharmacy',name:'Hospital / Institutional Pharmacy',icon:'🏥',desc:'In-hospital pharmacy for inpatients & OPD'},
    {slug:'online-pharmacy',name:'Online Pharmacy / Home Delivery',icon:'📦',desc:'E-pharmacy with delivery & refill subscriptions',popular:true},
    {slug:'generic-store',name:'Generic Medicine Store (Jan Aushadhi)',icon:'🟢',desc:'Government Jan Aushadhi generic medicines'},
    {slug:'ayurvedic-store',name:'Ayurvedic / Herbal Store',icon:'🌿',desc:'AYUSH products & traditional preparations'},
    {slug:'compounding-pharmacy',name:'Compounding Pharmacy',icon:'⚗️',desc:'Custom medication preparation & formulations'},
    {slug:'oncology-pharmacy',name:'Oncology Pharmacy',icon:'🎗️',desc:'Chemotherapy drugs & cytotoxic handling'},
    {slug:'cold-chain-pharmacy',name:'Cold Chain / Specialty Pharmacy',icon:'❄️',desc:'Biologics, insulin, vaccines & cold storage'},
    {slug:'pharma-wholesale',name:'Pharmaceutical Wholesale / Distributor',icon:'🚚',desc:'Bulk supply to retailers, hospitals & institutions'},
  ],
  homecare:[
    {slug:'home-nursing',name:'Home Nursing Services',icon:'👩‍⚕️',desc:'Registered nurses for post-surgery & chronic care',popular:true},
    {slug:'home-physio',name:'Home Physiotherapy',icon:'🏃',desc:'Physio visits for ortho, neuro & geriatric patients',popular:true},
    {slug:'elder-care',name:'Elder Care / Geriatric Support',icon:'👴',desc:'Daily assistance, companionship & medical monitoring'},
    {slug:'icu-at-home',name:'ICU at Home',icon:'🏥',desc:'Critical care monitoring & ventilator support'},
    {slug:'mother-newborn',name:'Mother & Newborn Care',icon:'🤱',desc:'Postnatal care, lactation support & baby care'},
    {slug:'emergency-ambulance',name:'Emergency Ambulance Service',icon:'🚑',desc:'BLS/ALS ambulance & emergency transport'},
    {slug:'patient-transport',name:'Patient Transport (Non-Emergency)',icon:'🚐',desc:'Scheduled transport for dialysis, chemo & OPD visits'},
  ],
  equipment:[
    {slug:'diagnostic-imaging',name:'Diagnostic Imaging Equipment',icon:'📡',desc:'X-ray, MRI, CT, ultrasound & imaging systems',popular:true},
    {slug:'surgical-instruments',name:'Surgical Instruments & OT Equipment',icon:'🔬',desc:'Surgical tools, OT lights & tables'},
    {slug:'dental-equipment',name:'Dental Equipment & Supplies',icon:'🦷',desc:'Dental chairs, handpieces & dental supplies'},
    {slug:'lab-equipment',name:'Lab Equipment & Analyser',icon:'🧪',desc:'Auto-analysers, centrifuges & lab instruments'},
    {slug:'consumables',name:'Medical Consumables & Disposables',icon:'📦',desc:'Syringes, cannulas, masks & disposables',popular:true},
    {slug:'ot-icu-equipment',name:'ICU / OT Critical Equipment',icon:'❤️',desc:'Ventilators, patient monitors & defibrillators'},
  ],
  wellness:[
    {slug:'fitness-gym',name:'Fitness Center / Gym',icon:'💪',desc:'Gyms, CrossFit, strength & cardio training',popular:true},
    {slug:'yoga-studio',name:'Yoga Studio',icon:'🧘',desc:'Yoga, pranayama, meditation & mindfulness',popular:true},
    {slug:'nutrition-clinic',name:'Nutrition & Dietetics Clinic',icon:'🥗',desc:'Clinical dieticians, sports nutrition & weight management'},
    {slug:'spa-wellness',name:'Spa & Wellness Center',icon:'💆',desc:'Massages, body treatments & relaxation therapies'},
    {slug:'naturopathy',name:'Naturopathy Center',icon:'🌿',desc:'Hydrotherapy, mud therapy & natural healing'},
    {slug:'mental-wellness',name:'Mental Wellness Center',icon:'🧠',desc:'Mindfulness, stress management & wellbeing coaching'},
  ],
  services:[
    {slug:'healthcare-staffing',name:'Healthcare Staffing Agency',icon:'👥',desc:'Nurses, doctors, paramedics & admin staff placement',popular:true},
    {slug:'medical-billing',name:'Medical Billing & Coding',icon:'🧾',desc:'Billing outsourcing, TPA claims & revenue cycle',popular:true},
    {slug:'tpa-insurance',name:'TPA / Insurance Services',icon:'🛡️',desc:'Third-party administration & health insurance'},
    {slug:'medical-tourism',name:'Medical Tourism Facilitator',icon:'✈️',desc:'International patient facilitation & healthcare tourism'},
    {slug:'hospital-consultancy',name:'Hospital Management Consultancy',icon:'📊',desc:'Hospital setup, accreditation & operations consulting'},
    {slug:'healthcare-it',name:'Healthcare IT Implementation',icon:'⚙️',desc:'HMS, EMR & health IT system implementation'},
  ],
};

export default function RegisterFamilyPage() {
  const params = useParams() as any;
  const familySlug: string = params?.family ?? '';
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [apiSubs, setApiSubs] = useState<any[]>([]);
  const m = META[familySlug] || {name:'Portal',color:'#0D7C66',dark:'#065F46',light:'#ECFDF5',border:'#6EE7B7',icon:'🏥',tagline:''};
  const raw = apiSubs.length > 0 ? apiSubs : (FALLBACK[familySlug] || []);
  const subtypes = raw.filter((s:any)=>s.name.toLowerCase().includes(search.toLowerCase())||(s.desc||'').toLowerCase().includes(search.toLowerCase()));
  const sel = raw.find((s:any)=>s.slug===selected);

  useEffect(()=>{
    api.get('/portal/families/'+familySlug).then(r=>{
      if(r.data?.subTypes?.length) setApiSubs(r.data.subTypes.map((s:any)=>({slug:s.slug,name:s.name,desc:s.description||'',icon:'🏥'})));
    }).catch(()=>{});
  },[familySlug]);

  return (
    <div style={{fontFamily:"'Poppins',sans-serif",minHeight:'100vh',background:'#F8FAFC'}}>

      {/* NAV */}
      <nav style={{background:'#fff',borderBottom:'1px solid #E2E8F0',padding:'0 32px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#0D7C66,#25D366)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:16}}>H</div>
          <span style={{fontWeight:800,fontSize:17,color:'#0F172A',letterSpacing:'-0.02em'}}>Hospi<span style={{color:'#0D7C66'}}>Bot</span></span>
        </a>
        <button onClick={()=>router.push('/register')} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#64748B',background:'none',border:'1px solid #E2E8F0',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
          ← Change Portal
        </button>
      </nav>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'40px 24px',display:'flex',gap:40,alignItems:'flex-start'}}>

        {/* LEFT — portal info */}
        <div style={{width:260,flexShrink:0,position:'sticky',top:80}}>
          <div style={{padding:20,borderRadius:18,background:`linear-gradient(145deg,${m.color},${m.dark})`,color:'#fff',marginBottom:16}}>
            <div style={{fontSize:36,marginBottom:10}}>{m.icon}</div>
            <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{m.name}</div>
            <div style={{fontSize:12,opacity:0.8,lineHeight:1.6}}>{m.tagline}</div>
          </div>
          <div style={{padding:16,background:'#fff',border:'1px solid #E2E8F0',borderRadius:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>What you get</div>
            {['WhatsApp-first patient communication','Auto-configured workflows for your type','GST billing & HIPAA-compliant records','14-day free trial, no card needed'].map(f=>(
              <div key={f} style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:8}}>
                <span style={{color:m.color,fontWeight:700,flexShrink:0,fontSize:13}}>✓</span>
                <span style={{fontSize:12.5,color:'#374151',lineHeight:1.5}}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — subtype picker */}
        <div style={{flex:1}}>
          {/* Steps */}
          <div style={{display:'flex',alignItems:'center',marginBottom:28}}>
            {['Choose Portal','Select Type','Organisation','Account'].map((s,i)=>(
              <div key={s} style={{display:'flex',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,
                    background:i<1?m.color:i===1?m.color:'#F1F5F9',
                    color:i<=1?'#fff':'#94A3B8',
                    boxShadow:i===1?'0 0 0 4px '+m.light:'none'}}>
                    {i<1?'✓':i+1}
                  </div>
                  <span style={{fontSize:12,fontWeight:i===1?600:400,color:i<=1?'#0F172A':'#94A3B8',whiteSpace:'nowrap'}}>{s}</span>
                </div>
                {i<3&&<div style={{width:28,height:1.5,background:i<1?m.color:'#E2E8F0',margin:'0 6px'}}/>}
              </div>
            ))}
          </div>

          <h1 style={{fontSize:24,fontWeight:800,color:'#0F172A',marginBottom:4,letterSpacing:'-0.02em'}}>What best describes your practice?</h1>
          <p style={{fontSize:13.5,color:'#64748B',marginBottom:22,lineHeight:1.6}}>This customises your portal's features, report templates and automation workflows.</p>

          {/* Search */}
          <div style={{position:'relative',marginBottom:22}}>
            <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#94A3B8',fontSize:15}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search practice types..." 
              style={{width:'100%',paddingLeft:40,paddingRight:16,paddingTop:11,paddingBottom:11,fontSize:13.5,borderRadius:12,border:'1.5px solid #E2E8F0',background:'#fff',outline:'none',fontFamily:"'Poppins',sans-serif",boxSizing:'border-box'}}
              onFocus={e=>{e.target.style.borderColor=m.color;e.target.style.boxShadow='0 0 0 3px '+m.color+'18';}}
              onBlur={e=>{e.target.style.borderColor='#E2E8F0';e.target.style.boxShadow='none';}}
            />
          </div>

          {/* Subtype cards grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:10,marginBottom:28}}>
            {subtypes.map((s:any)=>{
              const active = selected===s.slug;
              return(
                <button key={s.slug} onClick={()=>setSelected(s.slug)}
                  style={{
                    textAlign:'left',padding:'14px',borderRadius:14,cursor:'pointer',position:'relative',
                    border:active?`2px solid ${m.color}`:'1.5px solid #E8EDF5',
                    background:active?`linear-gradient(145deg,${m.light},#fff)`:'#fff',
                    boxShadow:active?`0 6px 20px ${m.color}1a`:'0 1px 3px rgba(0,0,0,0.04)',
                    transform:active?'translateY(-2px)':'none',
                    transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    fontFamily:"'Poppins',sans-serif",
                  }}>
                  {s.popular&&!active&&<span style={{position:'absolute',top:8,right:8,fontSize:9,fontWeight:700,background:'#FEF3C7',color:'#92400E',padding:'2px 6px',borderRadius:20}}>POPULAR</span>}
                  {active&&<div style={{position:'absolute',top:8,right:8,width:18,height:18,borderRadius:'50%',background:m.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:9,fontWeight:800}}>✓</div>}
                  <div style={{fontSize:22,marginBottom:7}}>{s.icon||'🏥'}</div>
                  <div style={{fontSize:12.5,fontWeight:700,color:'#0F172A',lineHeight:1.35,marginBottom:4,paddingRight:s.popular?20:0}}>{s.name}</div>
                  <div style={{fontSize:11,color:'#64748B',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{s.desc}</div>
                </button>
              );
            })}
            {subtypes.length===0&&(
              <div style={{gridColumn:'1/-1',textAlign:'center',padding:'40px 0',color:'#94A3B8'}}>
                <div style={{fontSize:28,marginBottom:8}}>🔍</div>
                <p style={{fontSize:13}}>No results for "{search}"</p>
                <button onClick={()=>setSearch('')} style={{fontSize:12,color:m.color,background:'none',border:'none',cursor:'pointer',textDecoration:'underline',fontFamily:"'Poppins',sans-serif"}}>Clear search</button>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <button onClick={()=>selected&&router.push('/register/'+familySlug+'/'+selected)}
              disabled={!selected}
              style={{
                display:'flex',alignItems:'center',gap:10,padding:'13px 28px',borderRadius:13,border:'none',
                background:selected?`linear-gradient(135deg,${m.color},${m.dark})`:'#CBD5E1',
                color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:14,fontWeight:700,
                cursor:selected?'pointer':'not-allowed',
                boxShadow:selected?`0 6px 20px ${m.color}44`:'none',
                transform:selected?'scale(1.02)':'scale(1)',transition:'all 0.2s',
              }}>
              {selected?<>Continue as {sel?.name} →</>:<>Select a type to continue</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
