'use client';
import { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Send, Phone, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

/* ── PORTAL CONFIG ─────────────────────────────────────────────────────────── */
const P = {
  clinical:   { name:'Clinical Portal',   short:'Clinical',   emoji:'🩺', c1:'#064E3B', c2:'#047857', c3:'#10B981', light:'#ECFDF5', desc:'Hospitals · Clinics · Doctors · Specialists', count:86 },
  diagnostic: { name:'Diagnostic Portal', short:'Diagnostic', emoji:'🔬', c1:'#1E3A5F', c2:'#1D4ED8', c3:'#3B82F6', light:'#EFF6FF', desc:'Pathology · Radiology · PCR · Imaging',     count:20 },
  pharmacy:   { name:'Pharmacy Portal',   short:'Pharmacy',   emoji:'💊', c1:'#14532D', c2:'#15803D', c3:'#22C55E', light:'#F0FDF4', desc:'Retail · Online · Hospital · Wholesale',     count:14 },
  homecare:   { name:'Home Care Portal',  short:'Home Care',  emoji:'🏠', c1:'#78350F', c2:'#B45309', c3:'#F59E0B', light:'#FFFBEB', desc:'Nursing · Physio · Elder Care · Ambulance',  count:16 },
  equipment:  { name:'Equipment Portal',  short:'Equipment',  emoji:'⚙️',  c1:'#3B0764', c2:'#6D28D9', c3:'#A78BFA', light:'#F5F3FF', desc:'Devices · Imaging · Surgical · Consumables', count:18 },
  wellness:   { name:'Wellness Portal',   short:'Wellness',   emoji:'💆', c1:'#881337', c2:'#BE185D', c3:'#F472B6', light:'#FFF1F2', desc:'Fitness · Yoga · Nutrition · Holistic',       count:18 },
  services:   { name:'Services Portal',   short:'Services',   emoji:'🤝', c1:'#0C4A6E', c2:'#0369A1', c3:'#38BDF8', light:'#F0F9FF', desc:'Staffing · Billing · TPA · Consultancy',     count:20 },
} as const;
type PortalSlug = keyof typeof P;

/* ── SUBTYPES ───────────────────────────────────────────────────────────────── */
const SUBS: Record<PortalSlug, {slug:string;name:string;icon:string;popular?:boolean}[]> = {
  clinical:[
    {slug:'individual-doctor',name:'Individual Doctor / GP',icon:'👨‍⚕️',popular:true},
    {slug:'specialist-doctor',name:'Specialist Doctor',icon:'🩻'},
    {slug:'multi-specialty-clinic',name:'Multi-Specialty Clinic',icon:'🏥',popular:true},
    {slug:'polyclinic',name:'Polyclinic',icon:'🏢'},
    {slug:'nursing-home',name:'Nursing Home (<30 beds)',icon:'🛏️'},
    {slug:'hospital-mid',name:'Hospital (30–200 beds)',icon:'🏨'},
    {slug:'hospital-large',name:'Hospital (200+ beds)',icon:'🏛️',popular:true},
    {slug:'ivf-fertility',name:'IVF / Fertility Center',icon:'🧬'},
    {slug:'maternity-hospital',name:'Maternity Hospital',icon:'🤱'},
    {slug:'dental-clinic',name:'Dental Clinic',icon:'🦷',popular:true},
    {slug:'eye-center',name:'Eye / Ophthalmology Center',icon:'👁️'},
    {slug:'dermatologist',name:'Dermatologist',icon:'✨'},
    {slug:'physiotherapy',name:'Physiotherapy Clinic',icon:'🏃'},
    {slug:'ayurveda',name:'Ayurveda / AYUSH Clinic',icon:'🌿'},
    {slug:'psychiatry',name:'Psychiatry / Mental Health',icon:'🧠'},
  ],
  diagnostic:[
    {slug:'pathology-lab',name:'Pathology / Blood Test Lab',icon:'🧪',popular:true},
    {slug:'sample-collection',name:'Sample Collection Center',icon:'💉'},
    {slug:'home-collection',name:'Home Sample Collection',icon:'🏠',popular:true},
    {slug:'radiology-center',name:'Radiology Center (X-Ray, CT, MRI)',icon:'📡',popular:true},
    {slug:'ultrasound-center',name:'Ultrasound Center',icon:'📊'},
    {slug:'pet-scan',name:'PET Scan Center',icon:'⚛️'},
    {slug:'cardiac-diagnostics',name:'Cardiac Diagnostics',icon:'❤️'},
    {slug:'molecular-lab',name:'Molecular / PCR Lab',icon:'🔭'},
    {slug:'health-checkup',name:'Health Checkup Center',icon:'📋'},
    {slug:'corporate-screening',name:'Corporate Wellness Screening',icon:'🏢'},
    {slug:'genetic-lab',name:'Genetic Testing Lab',icon:'🧬'},
    {slug:'reference-lab',name:'Reference / Central Lab',icon:'🏭'},
    {slug:'tele-radiology',name:'Tele-Radiology Service',icon:'💻'},
  ],
  pharmacy:[
    {slug:'retail-pharmacy',name:'Retail Medical Store / Chemist',icon:'🏪',popular:true},
    {slug:'hospital-pharmacy',name:'Hospital / Institutional Pharmacy',icon:'🏥'},
    {slug:'online-pharmacy',name:'Online Pharmacy / Home Delivery',icon:'📦',popular:true},
    {slug:'generic-store',name:'Jan Aushadhi Generic Store',icon:'🟢'},
    {slug:'ayurvedic-store',name:'Ayurvedic / Herbal Store',icon:'🌿'},
    {slug:'compounding-pharmacy',name:'Compounding Pharmacy',icon:'⚗️'},
    {slug:'oncology-pharmacy',name:'Oncology Pharmacy',icon:'🎗️'},
    {slug:'cold-chain-pharmacy',name:'Cold Chain / Specialty Pharmacy',icon:'❄️'},
    {slug:'pharma-wholesale',name:'Pharma Wholesale / Distributor',icon:'🚚'},
  ],
  homecare:[
    {slug:'home-nursing',name:'Home Nursing Services',icon:'👩‍⚕️',popular:true},
    {slug:'home-physio',name:'Home Physiotherapy',icon:'🏃',popular:true},
    {slug:'elder-care',name:'Elder Care / Geriatric Support',icon:'👴'},
    {slug:'icu-at-home',name:'ICU at Home',icon:'🏥'},
    {slug:'mother-newborn',name:'Mother & Newborn Care',icon:'🤱'},
    {slug:'emergency-ambulance',name:'Emergency Ambulance',icon:'🚑'},
    {slug:'patient-transport',name:'Patient Transport',icon:'🚐'},
  ],
  equipment:[
    {slug:'diagnostic-imaging',name:'Diagnostic Imaging Equipment',icon:'📡',popular:true},
    {slug:'surgical-instruments',name:'Surgical Instruments & OT',icon:'🔬'},
    {slug:'dental-equipment',name:'Dental Equipment',icon:'🦷'},
    {slug:'lab-equipment',name:'Lab Equipment & Analyser',icon:'🧪'},
    {slug:'consumables',name:'Medical Consumables',icon:'📦',popular:true},
    {slug:'ot-icu-equipment',name:'ICU / OT Critical Equipment',icon:'❤️'},
  ],
  wellness:[
    {slug:'fitness-gym',name:'Fitness Center / Gym',icon:'💪',popular:true},
    {slug:'yoga-studio',name:'Yoga Studio',icon:'🧘',popular:true},
    {slug:'nutrition-clinic',name:'Nutrition & Dietetics Clinic',icon:'🥗'},
    {slug:'spa-wellness',name:'Spa & Wellness Center',icon:'💆'},
    {slug:'naturopathy',name:'Naturopathy Center',icon:'🌿'},
    {slug:'mental-wellness',name:'Mental Wellness Center',icon:'🧠'},
  ],
  services:[
    {slug:'healthcare-staffing',name:'Healthcare Staffing Agency',icon:'👥',popular:true},
    {slug:'medical-billing',name:'Medical Billing & Coding',icon:'🧾',popular:true},
    {slug:'tpa-insurance',name:'TPA / Insurance Services',icon:'🛡️'},
    {slug:'medical-tourism',name:'Medical Tourism Facilitator',icon:'✈️'},
    {slug:'hospital-consultancy',name:'Hospital Management Consultancy',icon:'📊'},
    {slug:'healthcare-it',name:'Healthcare IT Implementation',icon:'⚙️'},
  ],
};

/* ── LEFT PANEL DATA ─────────────────────────────────────────────────────────── */
type LeftContent = { headline:string; sub:string; bullets:string[]; art:React.ReactNode };
function getLeft(step:number, portal:string): LeftContent {
  const port = P[portal as PortalSlug];
  const c = port?.c3 || '#10B981';
  const art0 = (
    <svg viewBox="0 0 320 280" fill="none" style={{width:'100%',maxWidth:300}}>
      {/* Abstract medical cross with orbiting circles */}
      <circle cx="160" cy="140" r="100" stroke="rgba(255,255,255,0.06)" strokeWidth="40"/>
      <circle cx="160" cy="140" r="60" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/>
      <rect x="140" y="80" width="40" height="120" rx="8" fill="rgba(255,255,255,0.12)"/>
      <rect x="100" y="120" width="120" height="40" rx="8" fill="rgba(255,255,255,0.12)"/>
      {/* Portal dots orbit */}
      {['🩺','🔬','💊','🏠','⚙️','💆','🤝'].map((e,i)=>{
        const a = (i/7)*Math.PI*2 - Math.PI/2;
        const x = 160 + 100*Math.cos(a), y = 140 + 100*Math.sin(a);
        return <text key={i} x={x-10} y={y+8} fontSize="18" style={{opacity:0.7}}>{e}</text>;
      })}
      <circle cx="160" cy="140" r="28" fill="rgba(255,255,255,0.15)"/>
      <text x="150" y="150" fontSize="22">🏥</text>
    </svg>
  );
  if(step===0) return {
    headline:'One platform for every healthcare provider',
    sub:'9 purpose-built portals. 231 practice types. WhatsApp-first automation from day one.',
    bullets:['Go live in under 7 days','No credit card required','HIPAA & DPDPA compliant'],
    art: art0,
  };
  const artsByPortal: Record<string,React.ReactNode> = {
    clinical:(
      <svg viewBox="0 0 300 260" fill="none" style={{width:'100%',maxWidth:280}}>
        <circle cx="150" cy="120" r="80" fill="rgba(255,255,255,0.05)"/>
        {/* ECG line */}
        <polyline points="30,120 70,120 85,80 100,160 115,100 130,140 150,120 270,120" stroke={`${c}cc`} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="150" cy="120" r="12" fill={`${c}30`} stroke={c} strokeWidth="1.5"/>
        <text x="143" y="125" fontSize="12">♡</text>
        {/* Stethoscope silhouette */}
        <path d="M90 160 Q90 200 130 200 Q170 200 170 170" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <circle cx="170" cy="163" r="12" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" fill="none"/>
      </svg>
    ),
    diagnostic:(
      <svg viewBox="0 0 300 260" fill="none" style={{width:'100%',maxWidth:280}}>
        {/* DNA helix */}
        {[0,1,2,3,4,5,6,7].map(i=>{
          const y=40+i*25, wave=Math.sin(i*0.8)*40;
          return <g key={i}>
            <circle cx={150+wave} cy={y} r="5" fill={`${c}80`}/>
            <circle cx={150-wave} cy={y} r="5" fill="rgba(255,255,255,0.2)"/>
            {i<7&&<line x1={150+wave} y1={y} x2={150-Math.sin((i+1)*0.8)*40} y2={y+25} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>}
          </g>;
        })}
        {/* Microscope */}
        <rect x="100" y="190" width="100" height="6" rx="3" fill="rgba(255,255,255,0.2)"/>
        <rect x="140" y="160" width="20" height="35" rx="4" fill="rgba(255,255,255,0.15)"/>
        <circle cx="150" cy="150" r="18" fill={`${c}20`} stroke={c} strokeWidth="1.5"/>
        <text x="142" y="156" fontSize="14">🔬</text>
      </svg>
    ),
    pharmacy:(
      <svg viewBox="0 0 300 260" fill="none" style={{width:'100%',maxWidth:280}}>
        <circle cx="150" cy="120" r="85" stroke="rgba(255,255,255,0.05)" strokeWidth="30"/>
        {/* Pill */}
        <rect x="90" y="105" width="120" height="42" rx="21" fill="rgba(255,255,255,0.08)"/>
        <rect x="90" y="105" width="60" height="42" rx="21" fill={`${c}30`}/>
        <line x1="150" y1="105" x2="150" y2="147" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
        {/* Molecular dots */}
        {[[60,60],[240,60],[60,190],[240,190],[150,40],[150,210]].map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r="7" fill={`${c}40`}/>
        ))}
        {[[60,60,150,40],[240,60,150,40],[60,190,150,210],[240,190,150,210]].map(([x1,y1,x2,y2],i)=>(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${c}30`} strokeWidth="1.5"/>
        ))}
        <text x="178" y="132" fontSize="18">💊</text>
        <text x="107" y="132" fontSize="18" style={{opacity:0.4}}>💊</text>
      </svg>
    ),
    homecare:(
      <svg viewBox="0 0 300 260" fill="none" style={{width:'100%',maxWidth:280}}>
        {/* House */}
        <path d="M90 140 L150 80 L210 140 L210 210 L90 210 Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
        <rect x="120" y="165" width="35" height="45" rx="3" fill="rgba(255,255,255,0.06)"/>
        <rect x="162" y="160" width="30" height="25" rx="3" fill={`${c}20`}/>
        {/* Heart */}
        <path d="M150 105 C150 105 135 92 135 82 C135 75 142 70 150 78 C158 70 165 75 165 82 C165 92 150 105 150 105Z" fill={`${c}60`}/>
        {/* Care hands */}
        <path d="M80 220 Q90 200 110 200 L190 200 Q210 200 220 220" stroke={`${c}80`} strokeWidth="3" fill="none" strokeLinecap="round"/>
        <text x="175" y="182" fontSize="14">+</text>
      </svg>
    ),
    equipment:(
      <svg viewBox="0 0 300 260" fill="none" style={{width:'100%',maxWidth:280}}>
        {/* Gear */}
        <circle cx="150" cy="120" r="50" stroke={`${c}40`} strokeWidth="16" strokeDasharray="20 8"/>
        <circle cx="150" cy="120" r="25" fill={`${c}20`} stroke={c} strokeWidth="1.5"/>
        {/* Device icons */}
        <text x="138" y="128" fontSize="18">⚙️</text>
        <text x="58" y="85" fontSize="22">🔬</text>
        <text x="210" y="85" fontSize="22">💉</text>
        <text x="58" y="180" fontSize="22">📡</text>
        <text x="210" y="180" fontSize="22">🩺</text>
        {/* Connecting lines */}
        {[[70,78,130,115],[220,78,170,115],[70,170,130,125],[220,170,170,125]].map(([x1,y1,x2,y2],i)=>(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${c}30`} strokeWidth="1.5" strokeDasharray="4 3"/>
        ))}
      </svg>
    ),
    wellness:(
      <svg viewBox="0 0 300 260" fill="none" style={{width:'100%',maxWidth:280}}>
        {/* Lotus */}
        <ellipse cx="150" cy="160" rx="100" ry="15" fill={`${c}15`}/>
        <path d="M150 80 Q110 120 130 160 Q150 145 150 80Z" fill={`${c}25`}/>
        <path d="M150 80 Q190 120 170 160 Q150 145 150 80Z" fill={`${c}20`}/>
        <path d="M150 90 Q120 130 110 165 Q135 155 150 90Z" fill={`${c}15`}/>
        <path d="M150 90 Q180 130 190 165 Q165 155 150 90Z" fill={`${c}15`}/>
        <circle cx="150" cy="155" r="14" fill={`${c}50`}/>
        <text x="142" y="161" fontSize="14">🌸</text>
        {/* Waves */}
        {[0,1,2].map(i=>(
          <path key={i} d={`M${50+i*10} ${190+i*8} Q${110} ${180+i*5} ${150} ${190+i*8} Q${190} ${200+i*5} ${250-i*10} ${190+i*8}`}
            stroke={`${c}${30-i*8}`} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        ))}
      </svg>
    ),
    services:(
      <svg viewBox="0 0 300 260" fill="none" style={{width:'100%',maxWidth:280}}>
        {/* Network nodes */}
        {[[150,60],[80,130],[220,130],[60,210],[150,210],[240,210]].map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r={i===0?16:12} fill={i===0?`${c}40`:'rgba(255,255,255,0.1)'} stroke={i===0?c:'rgba(255,255,255,0.2)'} strokeWidth="1.5"/>
        ))}
        {/* Connections */}
        {[[150,60,80,130],[150,60,220,130],[80,130,60,210],[80,130,150,210],[220,130,150,210],[220,130,240,210]].map(([x1,y1,x2,y2],i)=>(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${c}30`} strokeWidth="1.5"/>
        ))}
        <text x="142" y="66" fontSize="14">🤝</text>
      </svg>
    ),
  };
  const stepArts = [artsByPortal[portal]||art0, artsByPortal[portal]||art0];
  const orgArt = (
    <svg viewBox="0 0 300 260" fill="none" style={{width:'100%',maxWidth:280}}>
      {/* Building */}
      <rect x="70" y="80" width="160" height="150" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      <rect x="70" y="80" width="160" height="30" rx="6" fill={`${c}30`}/>
      {/* Windows */}
      {[[90,130],[130,130],[170,130],[90,170],[130,170],[170,170]].map(([x,y],i)=>(
        <rect key={i} cx={x} cy={y} x={x} y={y} width="28" height="22" rx="3" fill={`${c}25`}/>
      ))}
      <rect x="128" y="195" width="44" height="35" rx="3" fill={`${c}20`}/>
      {/* Location pin */}
      <circle cx="220" cy="65" r="16" fill={`${c}40`}/>
      <circle cx="220" cy="62" r="8" fill={`${c}70`}/>
      <path d="M220 70 L220 85" stroke={`${c}80`} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  const adminArt = (
    <svg viewBox="0 0 300 260" fill="none" style={{width:'100%',maxWidth:280}}>
      {/* Shield */}
      <path d="M150 50 L210 75 L210 140 Q210 190 150 210 Q90 190 90 140 L90 75 Z" fill={`${c}20`} stroke={c} strokeWidth="2"/>
      {/* Check */}
      <path d="M120 135 L140 155 L185 110" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* User avatar */}
      <circle cx="150" cy="118" r="20" fill="rgba(255,255,255,0.08)"/>
      <circle cx="150" cy="110" r="12" fill="rgba(255,255,255,0.15)"/>
      <path d="M120 135 Q120 125 150 125 Q180 125 180 135" fill="rgba(255,255,255,0.1)"/>
      {/* Key */}
      <text x="57" y="200" fontSize="28" style={{opacity:0.5}}>🔑</text>
      {/* Stars */}
      {[[230,80],[240,120],[50,100],[45,145]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="3" fill="rgba(255,255,255,0.3)"/>
      ))}
    </svg>
  );
  if(step===1) return {
    headline:`What type of ${port?.short||'practice'} are you?`,
    sub:'Your selection configures your portal with the right workflows, report templates, and WhatsApp automation for your specific practice.',
    bullets:['Auto-configured workflows','Pre-built WhatsApp templates','Purpose-built dashboard'],
    art: stepArts[0],
  };
  if(step===2) return {
    headline:'Set up your organisation profile',
    sub:'This becomes your portal identity — visible to your patients, staff, and on all reports and invoices you generate.',
    bullets:['Appears on patient reports','Used for GST & billing','Portal URL: hospibot.in/your-slug'],
    art: orgArt,
  };
  return {
    headline:'Create your secure admin account',
    sub:'You\'ll use these credentials to log in and manage your portal. You can add more staff members after your account is set up.',
    bullets:['Role-based access control','Add unlimited staff','Change anytime in settings'],
    art: adminArt,
  };
}

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry'];

/* ── COMPONENT ────────────────────────────────────────────────────────────────── */
function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<'fwd'|'back'>('fwd');
  const [animKey, setAnimKey] = useState(0);
  const [portal, setPortal] = useState<PortalSlug|''>('');
  const [subtype, setSubtype] = useState('');
  const [search, setSearch] = useState('');
  const [showOthers, setShowOthers] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [org, setOrg] = useState({name:'',slug:'',phone:'',email:'',address:'',city:'',state:'Telangana',pincode:'',gstNumber:''});
  const [admin, setAdmin] = useState({firstName:'',lastName:'',email:'',password:''});

  const pp = portal ? P[portal] : null;
  const c1 = pp?.c1 || '#064E3B', c2 = pp?.c2 || '#047857', c3 = pp?.c3 || '#10B981';
  const panelBg = step===0
    ? 'linear-gradient(160deg,#0F172A 0%,#1E293B 100%)'
    : `linear-gradient(160deg,${c1} 0%,${c2} 100%)`;

  const left = getLeft(step, portal);

  const slugify = (n:string) => n.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-').slice(0,40);
  const oSet = (k:string) => (e:any) => setOrg(p=>({...p,[k]:e.target.value,...(k==='name'?{slug:slugify(e.target.value)}:{})}));
  const aSet = (k:string) => (e:any) => setAdmin(p=>({...p,[k]:e.target.value}));

  const go = useCallback((n:number) => {
    setDir(n>step?'fwd':'back');
    setAnimKey(k=>k+1);
    setStep(n);
  }, [step]);

  const pickPortal = (slug: PortalSlug) => {
    setPortal(slug); setSubtype(''); setSearch(''); setShowOthers(false);
    setTimeout(()=>go(1), 260);
  };

  const pickSub = (slug:string) => {
    if(slug==='__others__'){setShowOthers(true);return;}
    setSubtype(slug);
    setTimeout(()=>go(2), 260);
  };

  const subtypeList = portal
    ? SUBS[portal].filter(s=>s.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const typeName = portal && subtype ? (SUBS[portal].find(s=>s.slug===subtype)?.name||subtype.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())) : '';

  const fi = (e:any) => { e.target.style.borderColor=c3; e.target.style.background='#fff'; e.target.style.boxShadow=`0 0 0 3px ${c3}25`; };
  const fo = (e:any) => { e.target.style.borderColor='#E2E8F0'; e.target.style.background='#F8FAFC'; e.target.style.boxShadow='none'; };

  const inputSt = {width:'100%',padding:'11px 14px',fontSize:15,borderRadius:10,border:'1.5px solid #E2E8F0',background:'#F8FAFC',outline:'none',fontFamily:"'Poppins',sans-serif",transition:'all 0.18s',boxSizing:'border-box',color:'#0F172A'} as any;

  async function submit() {
    if(!admin.firstName||!admin.email||!admin.password){toast.error('Please fill all required fields');return;}
    setSubmitting(true);
    try {
      await api.post('/auth/register',{
        name:org.name,slug:org.slug,phone:org.phone,email:org.email||admin.email,
        address:org.address,city:org.city,state:org.state,country:'India',
        pincode:org.pincode,gstNumber:org.gstNumber,
        adminFirstName:admin.firstName,adminLastName:admin.lastName,
        adminEmail:admin.email,adminPassword:admin.password,
        plan:'STARTER',portalFamily:portal,subTypeSlug:subtype,
      });
      setSuccess(true);
    } catch(err:any){toast.error(err?.response?.data?.message||'Registration failed. Please try again.');}
    finally{setSubmitting(false);}
  }

  /* ── SUCCESS ─────────────────────────────────────────────────────────────── */
  if(success) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${pp?.light||'#ECFDF5'},#fff)`,fontFamily:"'Poppins',sans-serif",padding:24}}>
      <div style={{background:'#fff',borderRadius:28,padding:56,textAlign:'center',maxWidth:440,width:'90%',boxShadow:`0 24px 80px ${c3}25`,border:`1px solid ${c3}25`}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:pp?.light,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
          <CheckCircle2 size={40} color={c2}/>
        </div>
        <div style={{fontSize:38,marginBottom:10}}>🎉</div>
        <h2 style={{fontSize:24,fontWeight:800,color:'#0F172A',marginBottom:8}}>You&apos;re all set!</h2>
        <p style={{fontSize:15,color:'#64748B',lineHeight:1.7,marginBottom:6}}><strong>{org.name}</strong> is now on <strong>{pp?.name}</strong>.</p>
        <p style={{fontSize:13,color:'#94A3B8',marginBottom:32}}>Your 14-day free trial has started — no credit card needed.</p>
        <button onClick={()=>router.push(`/${portal}/login`)} style={{width:'100%',padding:15,borderRadius:14,border:'none',background:`linear-gradient(135deg,${c1},${c2})`,color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:`0 8px 28px ${c3}44`,marginBottom:10}}>
          Sign in to {pp?.name} →
        </button>
        <p style={{fontSize:12,color:'#94A3B8'}}>Use the email & password you just created</p>
      </div>
    </div>
  );

  /* ── MAIN ────────────────────────────────────────────────────────────────── */
  return (
    <div style={{height:'100vh',display:'flex',overflow:'hidden',fontFamily:"'Poppins',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        button{font-family:'Poppins',sans-serif}
        input,select,textarea{font-family:'Poppins',sans-serif}
        @keyframes slideInFwd{from{opacity:0;transform:translateX(48px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInBack{from{opacity:0;transform:translateX(-48px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px}
        .sub-card:hover{transform:translateY(-2px)!important;box-shadow:0 6px 20px rgba(0,0,0,0.1)!important}
        .portal-card:hover{transform:translateY(-3px) scale(1.02)!important}
      `}</style>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{width:'50%',background:panelBg,display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'40px 48px',position:'relative',overflow:'hidden',transition:'background 0.6s ease',flexShrink:0}}>
        {/* Noise texture overlay */}
        <div style={{position:'absolute',inset:0,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")',opacity:0.4,pointerEvents:'none'}}/>
        {/* Top glow */}
        <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle,${c3}20,transparent 70%)`,pointerEvents:'none'}}/>

        {/* Logo */}
        <div>
          <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',marginBottom:48}}>
            <div style={{width:38,height:38,borderRadius:11,background:'linear-gradient(135deg,#0D7C66,#25D366)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:17,boxShadow:'0 4px 16px rgba(0,0,0,0.2)'}}>H</div>
            <span style={{fontWeight:800,fontSize:18,color:'#fff',letterSpacing:'-0.02em'}}>Hospi<span style={{color:'#25D366'}}>Bot</span></span>
          </a>

          {/* Step progress dots */}
          <div style={{display:'flex',gap:6,marginBottom:48}}>
            {['Portal','Type','Details','Account'].map((s,i)=>(
              <div key={s} style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:i<step?28:i===step?28:8,height:8,borderRadius:99,background:i<step?'rgba(255,255,255,0.9)':i===step?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.2)',transition:'all 0.4s ease'}}/>
              </div>
            ))}
            <span style={{marginLeft:8,fontSize:12.5,color:'rgba(255,255,255,0.5)',fontWeight:500}}>Step {step+1} of 4</span>
          </div>

          {/* Animated content */}
          <div key={`left-${step}-${portal}`} style={{animation:'fadeUp 0.5s ease both'}}>
            <h1 style={{fontSize:'clamp(22px,2.2vw,30px)',fontWeight:800,color:'#fff',lineHeight:1.25,marginBottom:14,letterSpacing:'-0.02em'}}>
              {left.headline}
            </h1>
            <p style={{fontSize:14.5,color:'rgba(255,255,255,0.65)',lineHeight:1.7,marginBottom:28,maxWidth:360}}>
              {left.sub}
            </p>
            {left.bullets.map(b=>(
              <div key={b} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:`${c3}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke={c3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{fontSize:13.5,color:'rgba(255,255,255,0.7)',fontWeight:500}}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Illustration */}
        <div key={`art-${step}-${portal}`} style={{display:'flex',justifyContent:'center',animation:'fadeUp 0.6s 0.1s ease both',paddingBottom:16,opacity:0.9}}>
          {left.art}
        </div>

        {/* Bottom trust */}
        <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
          {['HIPAA','DPDPA','NABH','ABDM'].map(b=>(
            <span key={b} style={{fontSize:10.5,fontWeight:700,padding:'3px 9px',borderRadius:20,background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.6)',letterSpacing:'0.06em'}}>{b}</span>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div style={{width:'50%',background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
        {/* Top bar */}
        <div style={{padding:'20px 40px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #F1F5F9',flexShrink:0}}>
          {step>0 ? (
            <button onClick={()=>go(step-1)} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#64748B',background:'none',border:'none',cursor:'pointer',padding:'6px 0'}}>
              <ArrowLeft size={15}/> Back
            </button>
          ) : <div/>}
          <a href="/auth/login" style={{fontSize:13,color:'#64748B',textDecoration:'none'}}>
            Already registered? <span style={{color:c2,fontWeight:600}}>Sign in</span>
          </a>
        </div>

        {/* Animated step content */}
        <div key={`right-${animKey}`} style={{flex:1,overflowY:'auto',padding:'36px 48px 32px',animation:`${dir==='fwd'?'slideInFwd':'slideInBack'} 0.38s cubic-bezier(0.34,1.0,0.64,1) both`}}>

          {/* ── STEP 0: Portal Picker ──────────────────────────────────────── */}
          {step===0 && (
            <>
              <div style={{marginBottom:28}}>
                <h2 style={{fontSize:'clamp(20px,2vw,26px)',fontWeight:800,color:'#0F172A',marginBottom:6,letterSpacing:'-0.02em'}}>Which portal fits your practice?</h2>
                <p style={{fontSize:14.5,color:'#64748B',lineHeight:1.6}}>Click a card to select your portal and proceed automatically.</p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:12}}>
                {(Object.entries(P) as [PortalSlug,typeof P[PortalSlug]][]).map(([slug,p])=>(
                  <button key={slug} onClick={()=>pickPortal(slug)}
                    className="portal-card"
                    style={{textAlign:'left',padding:'18px 16px',borderRadius:16,border:`1.5px solid ${portal===slug?p.c3:'#E8EDF5'}`,background:portal===slug?`linear-gradient(145deg,${p.light},#fff)`:'#FAFBFC',cursor:'pointer',position:'relative',transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:portal===slug?`0 8px 24px ${p.c3}20`:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    {portal===slug && <div style={{position:'absolute',top:10,right:10,width:20,height:20,borderRadius:'50%',background:p.c3,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:800}}>✓</div>}
                    <div style={{fontSize:28,marginBottom:10}}>{p.emoji}</div>
                    <div style={{fontSize:13.5,fontWeight:700,color:'#0F172A',marginBottom:4,lineHeight:1.3}}>{p.name}</div>
                    <div style={{fontSize:11.5,color:'#64748B',lineHeight:1.5,marginBottom:9}}>{p.desc}</div>
                    <div style={{fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:20,background:p.light,color:p.c2,display:'inline-block'}}>{p.count} types</div>
                  </button>
                ))}
              </div>
              <p style={{textAlign:'center',fontSize:13,color:'#CBD5E1',marginTop:24}}>Click any card to proceed automatically</p>
            </>
          )}

          {/* ── STEP 1: Subtype Picker ─────────────────────────────────────── */}
          {step===1 && pp && !showOthers && (
            <>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22}}>
                <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${c1},${c2})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{pp.emoji}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:'#0F172A'}}>{pp.name}</div>
                  <div style={{fontSize:12.5,color:'#94A3B8'}}>Select your practice type below</div>
                </div>
              </div>
              <h2 style={{fontSize:22,fontWeight:800,color:'#0F172A',marginBottom:6,letterSpacing:'-0.02em'}}>What type of {pp.short} are you?</h2>
              <p style={{fontSize:14,color:'#64748B',marginBottom:20}}>Click a card to select and auto-advance to the next step.</p>
              {/* Search */}
              <div style={{position:'relative',marginBottom:20}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:15,color:'#CBD5E1'}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search practice types…"
                  style={{...inputSt,paddingLeft:40}} onFocus={fi} onBlur={fo}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:10}}>
                {subtypeList.map(s=>(
                  <button key={s.slug} onClick={()=>pickSub(s.slug)} className="sub-card"
                    style={{textAlign:'left',padding:'13px',borderRadius:13,border:`1.5px solid ${subtype===s.slug?c2:'#E8EDF5'}`,background:subtype===s.slug?`linear-gradient(145deg,${pp.light},#fff)`:'#FAFBFC',cursor:'pointer',position:'relative',transition:'all 0.22s',boxShadow:subtype===s.slug?`0 4px 16px ${c3}20`:'0 1px 3px rgba(0,0,0,0.04)'}}>
                    {s.popular&&subtype!==s.slug&&<span style={{position:'absolute',top:7,right:7,fontSize:9,fontWeight:700,background:'#FEF3C7',color:'#92400E',padding:'2px 6px',borderRadius:20}}>POPULAR</span>}
                    {subtype===s.slug&&<div style={{position:'absolute',top:7,right:7,width:18,height:18,borderRadius:'50%',background:c2,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:9,fontWeight:800}}>✓</div>}
                    <div style={{fontSize:22,marginBottom:7}}>{s.icon}</div>
                    <div style={{fontSize:12.5,fontWeight:700,color:'#0F172A',lineHeight:1.35,paddingRight:s.popular?18:0}}>{s.name}</div>
                  </button>
                ))}
                {/* Others card */}
                <button onClick={()=>pickSub('__others__')} className="sub-card"
                  style={{textAlign:'left',padding:'13px',borderRadius:13,border:'1.5px dashed #CBD5E1',background:'#FAFBFC',cursor:'pointer',transition:'all 0.22s'}}>
                  <div style={{fontSize:22,marginBottom:7}}>❓</div>
                  <div style={{fontSize:12.5,fontWeight:700,color:'#64748B',marginBottom:3}}>Others / Not Listed</div>
                  <div style={{fontSize:11,color:'#94A3B8',lineHeight:1.4}}>Don&apos;t see your type?</div>
                </button>
              </div>
            </>
          )}

          {/* ── OTHERS PANEL ──────────────────────────────────────────────── */}
          {step===1 && showOthers && pp && (
            <div style={{maxWidth:440}}>
              <div style={{background:`linear-gradient(135deg,${c1},${c2})`,borderRadius:16,padding:24,color:'#fff',marginBottom:20}}>
                <div style={{fontSize:28,marginBottom:10}}>🙋</div>
                <h3 style={{fontSize:18,fontWeight:800,marginBottom:6}}>Your type isn&apos;t listed yet</h3>
                <p style={{fontSize:13.5,opacity:0.85,lineHeight:1.65}}>We add new subtypes regularly. Share your details and we&apos;ll contact you within 24 hours to get you onboarded.</p>
              </div>
              {!contactSent ? (
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Your Name *</label>
                    <input placeholder="Dr. Priya Sharma" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>WhatsApp / Phone *</label>
                    <input placeholder="+91 9876543210" value={contactPhone} onChange={e=>setContactPhone(e.target.value)} style={inputSt} onFocus={fi} onBlur={fo}/></div>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Describe your practice *</label>
                    <textarea rows={3} placeholder="e.g. Stem Cell Therapy Center, Proton Therapy…" value={contactMsg} onChange={e=>setContactMsg(e.target.value)}
                      style={{...inputSt,resize:'vertical'}} onFocus={fi} onBlur={fo}/></div>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>setShowOthers(false)} style={{padding:'11px 18px',borderRadius:12,border:'1.5px solid #E2E8F0',background:'#fff',fontSize:13.5,fontWeight:600,cursor:'pointer',color:'#475569'}}>← Back</button>
                    <button onClick={()=>{if(!contactPhone){toast.error('Please enter phone');return;}setContactSent(true);}}
                      style={{flex:1,padding:11,borderRadius:12,border:'none',background:`linear-gradient(135deg,${c1},${c2})`,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <Send size={15}/> Notify Me When Added
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'24px 0'}}>
                  <div style={{fontSize:36,marginBottom:12}}>✅</div>
                  <h3 style={{fontSize:18,fontWeight:800,color:'#0F172A',marginBottom:8}}>Got it! We&apos;ll reach out soon.</h3>
                  <p style={{fontSize:14,color:'#64748B',lineHeight:1.65,marginBottom:20}}>Our team will contact you on <strong>{contactPhone}</strong> within 24 hours.</p>
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 18px',background:'#F0FDF4',borderRadius:12,border:'1px solid #BBF7D0',marginBottom:20,textAlign:'left'}}>
                    <Phone size={18} color="#15803D"/>
                    <div><div style={{fontSize:12,fontWeight:700,color:'#15803D'}}>Admin Contact</div><div style={{fontSize:13,color:'#374151'}}>admin@hospibot.in</div></div>
                  </div>
                  <a href="/" style={{fontSize:14,color:c2,textDecoration:'none',fontWeight:600}}>← Return to HospiBot home</a>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Org Details ────────────────────────────────────────── */}
          {step===2 && pp && (
            <>
              <h2 style={{fontSize:22,fontWeight:800,color:'#0F172A',marginBottom:6,letterSpacing:'-0.02em'}}>Organisation Details</h2>
              <p style={{fontSize:14,color:'#64748B',marginBottom:24}}>Tell us about your healthcare facility.</p>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Organisation Name <span style={{color:'#EF4444'}}>*</span></label>
                  <input value={org.name} onChange={oSet('name')} placeholder="e.g. Apollo Diagnostics Hyderabad" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Portal URL <span style={{color:'#EF4444'}}>*</span></label>
                  <div style={{display:'flex',borderRadius:10,border:'1.5px solid #E2E8F0',overflow:'hidden',background:'#F8FAFC'}}>
                    <span style={{padding:'11px 12px',background:'#F1F5F9',borderRight:'1px solid #E2E8F0',fontSize:13.5,color:'#64748B',whiteSpace:'nowrap',display:'flex',alignItems:'center'}}>hospibot.in/</span>
                    <input value={org.slug} onChange={oSet('slug')} placeholder="apollo-diagnostics-hyd" style={{flex:1,padding:'11px 14px',fontSize:14,border:'none',background:'transparent',outline:'none',fontFamily:"'Poppins',sans-serif",color:'#0F172A'}}/>
                  </div>
                  <span style={{fontSize:11,color:'#94A3B8',marginTop:4,display:'block'}}>Cannot be changed after registration</span></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Phone <span style={{color:'#EF4444'}}>*</span></label>
                    <input value={org.phone} onChange={oSet('phone')} placeholder="+91 98765 43210" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Email</label>
                    <input type="email" value={org.email} onChange={oSet('email')} placeholder="info@yourorg.com" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                </div>
                <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Address</label>
                  <input value={org.address} onChange={oSet('address')} placeholder="Building, street, area" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>City <span style={{color:'#EF4444'}}>*</span></label>
                    <input value={org.city} onChange={oSet('city')} placeholder="Hyderabad" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>State</label>
                    <select value={org.state} onChange={oSet('state')} style={{...inputSt,cursor:'pointer'}} onFocus={fi} onBlur={fo}>
                      {STATES.map(s=><option key={s}>{s}</option>)}</select></div>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Pincode</label>
                    <input value={org.pincode} onChange={oSet('pincode')} placeholder="500001" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                </div>
                <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>GST Number <span style={{fontSize:11,color:'#94A3B8',fontWeight:400,textTransform:'none'}}>(optional)</span></label>
                  <input value={org.gstNumber} onChange={oSet('gstNumber')} placeholder="29AAAAA0000A1Z5" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                <button onClick={()=>{if(!org.name||!org.phone||!org.city){toast.error('Name, Phone & City required');return;}go(3);}}
                  style={{marginTop:8,padding:'13px',borderRadius:13,border:'none',background:`linear-gradient(135deg,${c1},${c2})`,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:`0 6px 20px ${c3}40`}}>
                  Continue to Admin Account →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Admin Account ─────────────────────────────────────── */}
          {step===3 && pp && (
            <>
              <h2 style={{fontSize:22,fontWeight:800,color:'#0F172A',marginBottom:6,letterSpacing:'-0.02em'}}>Admin Account</h2>
              <p style={{fontSize:14,color:'#64748B',marginBottom:24}}>Create your primary login for the {pp.name}.</p>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>First Name <span style={{color:'#EF4444'}}>*</span></label>
                    <input value={admin.firstName} onChange={aSet('firstName')} placeholder="Vinod" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                  <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Last Name</label>
                    <input value={admin.lastName} onChange={aSet('lastName')} placeholder="Kumar" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                </div>
                <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Admin Email <span style={{color:'#EF4444'}}>*</span></label>
                  <input type="email" value={admin.email} onChange={aSet('email')} placeholder="admin@yourorg.com" style={inputSt} onFocus={fi} onBlur={fo}/></div>
                <div><label style={{fontSize:11.5,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',display:'block',marginBottom:5}}>Password <span style={{color:'#EF4444'}}>*</span></label>
                  <div style={{position:'relative'}}>
                    <input type={showPwd?'text':'password'} value={admin.password} onChange={aSet('password')} placeholder="Minimum 8 characters" style={{...inputSt,paddingRight:44}} onFocus={fi} onBlur={fo}/>
                    <button type="button" onClick={()=>setShowPwd(v=>!v)} style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94A3B8',display:'flex',padding:0}}>
                      {showPwd?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
                {/* Summary */}
                <div style={{padding:'16px 18px',background:'#F8FAFC',borderRadius:14,border:'1px solid #E2E8F0',marginTop:4}}>
                  <div style={{fontSize:11.5,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:12}}>Registration Summary</div>
                  {[['Portal',pp.name],['Type',typeName],['Organisation',org.name||'—'],['City',org.city||'—'],['Plan','14-day Free Trial']].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F1F5F9'}}>
                      <span style={{fontSize:13.5,color:'#64748B'}}>{k}</span>
                      <span style={{fontSize:13.5,fontWeight:600,color:k==='Plan'?c2:'#0F172A'}}>{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={submit} disabled={submitting}
                  style={{padding:'14px',borderRadius:13,border:'none',background:submitting?'#CBD5E1':`linear-gradient(135deg,${c1},${c2})`,color:'#fff',fontSize:15,fontWeight:700,cursor:submitting?'not-allowed':'pointer',boxShadow:submitting?'none':`0 6px 20px ${c3}40`,transition:'all 0.2s'}}>
                  {submitting?'Creating your account…':'Create Account & Start Free Trial →'}
                </button>
                <p style={{fontSize:12.5,color:'#94A3B8',textAlign:'center'}}>
                  By registering you agree to our <span style={{textDecoration:'underline',cursor:'pointer'}}>Terms</span> &amp; <span style={{textDecoration:'underline',cursor:'pointer'}}>Privacy Policy</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={null}><RegisterWizard/></Suspense>;
}
