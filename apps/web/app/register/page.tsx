'use client';
import { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Send, Phone, ArrowLeft, Building2, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { DIAGNOSTIC_TIERS, TIER_FEATURES_DETAIL, type LabTier } from '@/lib/diagnostic-tiers';

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
  const c2 = port?.c2 || '#047857';

  // ── PREMIUM SVG ILLUSTRATIONS ──────────────────────────────────────────────
  const artStep0 = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <radialGradient id="g0a" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(255,255,255,0.15)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/></radialGradient>
        <filter id="glow0"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Outer rings */}
      <circle cx="170" cy="150" r="120" stroke="rgba(255,255,255,0.06)" strokeWidth="40"/>
      <circle cx="170" cy="150" r="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="6 4"/>
      <circle cx="170" cy="150" r="55" fill="url(#g0a)"/>
      {/* Centre cross */}
      <rect x="155" y="105" width="30" height="90" rx="7" fill="rgba(255,255,255,0.12)"/>
      <rect x="125" y="135" width="90" height="30" rx="7" fill="rgba(255,255,255,0.12)"/>
      <rect x="159" y="109" width="22" height="82" rx="5" fill="rgba(255,255,255,0.08)"/>
      <rect x="129" y="139" width="82" height="22" rx="5" fill="rgba(255,255,255,0.08)"/>
      {/* Portal icons on orbit */}
      {[['🩺',0],['🔬',1],['💊',2],['🏠',3],['⚙️',4],['💆',5],['🤝',6]].map(([e,i])=>{
        const angle = (Number(i)/7)*Math.PI*2 - Math.PI/2;
        const x = 170 + 112*Math.cos(angle), y = 150 + 112*Math.sin(angle);
        return (
          <g key={Number(i)} filter="url(#glow0)">
            <circle cx={x} cy={y} r="18" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
            <text x={x-9} y={y+7} fontSize="16">{e as string}</text>
          </g>
        );
      })}
      <circle cx="170" cy="150" r="32" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <text x="158" y="159" fontSize="22">🏥</text>
      {/* Pulse line */}
      <polyline points="30,240 60,240 72,215 84,265 96,230 108,250 130,240 210,240" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );

  const artClinical1 = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <linearGradient id="ecg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="rgba(255,255,255,0)"/><stop offset="40%" stopColor={`${c}cc`}/><stop offset="100%" stopColor="rgba(255,255,255,0)"/></linearGradient>
        <filter id="glowC"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Background rings */}
      <circle cx="170" cy="145" r="110" stroke="rgba(255,255,255,0.04)" strokeWidth="35"/>
      <circle cx="170" cy="145" r="75" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="5 3"/>
      {/* Doctor silhouette */}
      <circle cx="170" cy="100" r="32" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      <path d="M130 175 Q130 155 170 155 Q210 155 210 175 L215 230 L125 230 Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      {/* White coat detail */}
      <path d="M145 175 L148 225 M195 175 L192 225" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      <rect x="155" y="180" width="30" height="18" rx="4" fill="rgba(255,255,255,0.08)"/>
      {/* Stethoscope */}
      <path d="M185 148 Q205 148 205 168 Q205 188 185 188 Q175 188 175 180" stroke={`${c}bb`} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="175" cy="183" r="8" fill="none" stroke={`${c}aa`} strokeWidth="2" filter="url(#glowC)"/>
      <path d="M185 128 L185 148" stroke={`${c}bb`} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="185" cy="124" r="6" fill={`${c}60`} stroke={c} strokeWidth="1.5" filter="url(#glowC)"/>
      {/* ECG wave */}
      <polyline points="30,255 65,255 78,225 92,280 106,240 118,260 140,255 210,255 225,255" stroke="url(#ecg)" strokeWidth="2" fill="none" strokeLinecap="round" filter="url(#glowC)"/>
      <circle cx="170" cy="100" r="20" fill="rgba(255,255,255,0.08)"/>
      <text x="160" y="107" fontSize="18">👨‍⚕️</text>
    </svg>
  );

  const artDiagnostic1 = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <linearGradient id="dnaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity="0.8"/><stop offset="100%" stopColor={c} stopOpacity="0.2"/></linearGradient>
        <filter id="glowD"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* DNA helix — two strands */}
      {[0,1,2,3,4,5,6,7,8].map(i => {
        const y = 35 + i * 27;
        const wave1 = Math.sin(i * 0.75) * 45;
        const wave2 = Math.sin(i * 0.75 + Math.PI) * 45;
        const x1 = 115 + wave1, x2 = 115 + wave2;
        return (
          <g key={i} filter="url(#glowD)">
            <circle cx={x1} cy={y} r="7" fill={`${c}70`} stroke={c} strokeWidth="1"/>
            <circle cx={x2} cy={y} r="7" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
            {i < 8 && (
              <line x1={x1} y1={y} x2={115 + Math.sin((i+1)*0.75)*45} y2={y+27}
                stroke={`${c}40`} strokeWidth="1.5"/>
            )}
            {Math.abs(wave1-wave2) < 15 && (
              <line x1={x1} y1={y} x2={x2} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 2"/>
            )}
          </g>
        );
      })}
      {/* Microscope base */}
      <rect x="210" y="190" width="90" height="8" rx="4" fill="rgba(255,255,255,0.2)"/>
      <rect x="245" y="145" width="20" height="50" rx="4" fill="rgba(255,255,255,0.12)"/>
      <path d="M240 145 L260 145 L265 130 L235 130 Z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <circle cx="255" cy="125" r="16" fill={`${c}20`} stroke={c} strokeWidth="1.5" filter="url(#glowD)"/>
      <text x="247" y="131" fontSize="14">🔬</text>
      {/* Test tube */}
      <rect x="28" y="160" width="18" height="55" rx="9" fill={`${c}25`} stroke={`${c}60`} strokeWidth="1.5"/>
      <rect x="28" y="190" width="18" height="25" rx="0 0 9 9" fill={`${c}40`}/>
      <line x1="32" y1="170" x2="42" y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <line x1="32" y1="180" x2="42" y2="180" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
    </svg>
  );

  const artPharmacy1 = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <linearGradient id="pillG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={`${c}60`}/><stop offset="50%" stopColor={`${c}20`}/><stop offset="100%" stopColor="rgba(255,255,255,0.1)"/></linearGradient>
        <filter id="glowP"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Green cross (pharmacy) */}
      <rect x="140" y="60" width="60" height="180" rx="10" fill="rgba(255,255,255,0.06)"/>
      <rect x="80" y="120" width="180" height="60" rx="10" fill="rgba(255,255,255,0.06)"/>
      <rect x="148" y="68" width="44" height="164" rx="7" fill={`${c}20`}/>
      <rect x="88" y="128" width="164" height="44" rx="7" fill={`${c}20`}/>
      {/* Large pill center */}
      <rect x="118" y="128" width="104" height="44" rx="22" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <rect x="118" y="128" width="52" height="44" rx="22 0 0 22" fill={`${c}35`} filter="url(#glowP)"/>
      <line x1="170" y1="128" x2="170" y2="172" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      {/* Floating pills */}
      {[[55,80,35,16],[270,90,30,14],[50,200,28,13],[280,195,32,14]].map(([cx,cy,rw,rh],i)=>(
        <g key={i} filter="url(#glowP)">
          <rect x={cx-rw/2} y={cy-rh/2} width={rw} height={rh} rx={rh/2} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <rect x={cx-rw/2} y={cy-rh/2} width={rw/2} height={rh} rx={`${rh/2} 0 0 ${rh/2}`} fill={`${c}40`}/>
        </g>
      ))}
      {/* Molecule nodes */}
      {[[170,260],[130,245],[210,245]].map(([x,y],i)=>(
        <g key={i}><circle cx={x} cy={y} r={i===0?9:7} fill={`${c}${i===0?'50':'30'}`} stroke={`${c}60`} strokeWidth="1"/></g>
      ))}
      <line x1="170" y1="251" x2="130" y2="245" stroke={`${c}40`} strokeWidth="1.5"/>
      <line x1="170" y1="251" x2="210" y2="245" stroke={`${c}40`} strokeWidth="1.5"/>
    </svg>
  );

  const artHomecare1 = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <linearGradient id="hcG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={`${c}60`}/><stop offset="100%" stopColor={`${c}20`}/></linearGradient>
        <filter id="glowH"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* House */}
      <path d="M85 155 L170 70 L255 155 L255 250 L85 250 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)" strokeWidth="2"/>
      {/* Roof shine */}
      <path d="M170 74 L250 152" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      {/* Door */}
      <rect x="148" y="200" width="44" height="50" rx="4" fill={`${c}20`} stroke={`${c}40`} strokeWidth="1.5"/>
      <circle cx="188" cy="225" r="3" fill={`${c}60`}/>
      {/* Windows */}
      <rect x="98" y="165" width="44" height="36" rx="5" fill={`${c}15`} stroke={`${c}35`} strokeWidth="1.5"/>
      <rect x="198" y="165" width="44" height="36" rx="5" fill={`${c}15`} stroke={`${c}35`} strokeWidth="1.5"/>
      {/* Window cross */}
      <line x1="120" y1="165" x2="120" y2="201" stroke={`${c}30`} strokeWidth="1"/>
      <line x1="98" y1="183" x2="142" y2="183" stroke={`${c}30`} strokeWidth="1"/>
      <line x1="220" y1="165" x2="220" y2="201" stroke={`${c}30`} strokeWidth="1"/>
      <line x1="198" y1="183" x2="242" y2="183" stroke={`${c}30`} strokeWidth="1"/>
      {/* Glowing heart above house */}
      <path d="M170 50 C170 50 148 32 148 18 C148 9 157 4 170 14 C183 4 192 9 192 18 C192 32 170 50 170 50Z" fill={`${c}60`} stroke={c} strokeWidth="1" filter="url(#glowH)"/>
      {/* Care hands at base */}
      <path d="M60 265 Q75 245 100 245 L240 245 Q265 245 280 265" stroke={`${c}50`} strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Plus signs floating */}
      <text x="38" y="140" fontSize="20" fill={`${c}60`} filter="url(#glowH)">+</text>
      <text x="290" y="155" fontSize="16" fill={`${c}50`} filter="url(#glowH)">+</text>
    </svg>
  );

  const artEquipment1 = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <filter id="glowE"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Center gear */}
      <circle cx="170" cy="150" r="52" stroke={`${c}40`} strokeWidth="18" strokeDasharray="22 10"/>
      <circle cx="170" cy="150" r="28" fill={`${c}20`} stroke={c} strokeWidth="2" filter="url(#glowE)"/>
      <circle cx="170" cy="150" r="14" fill={`${c}40`}/>
      {/* Satellite nodes */}
      {[[170,55],[265,150],[170,245],[75,150]].map(([x,y],i)=>(
        <g key={i} filter="url(#glowE)">
          <circle cx={x} cy={y} r="20" fill="rgba(255,255,255,0.08)" stroke={`${c}50`} strokeWidth="1.5"/>
          <line x1={x} y1={y} x2="170" y2="150" stroke={`${c}25`} strokeWidth="1.5" strokeDasharray="4 3"/>
        </g>
      ))}
      <text x="160" y="48" fontSize="16">📡</text>
      <text x="256" y="158" fontSize="16">💉</text>
      <text x="160" y="250" fontSize="16">🔬</text>
      <text x="60" y="158" fontSize="16">🩺</text>
      {/* Diagonal nodes */}
      {[[110,90],[230,90],[230,210],[110,210]].map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <line x1={x} y1={y} x2="170" y2="150" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        </g>
      ))}
      <text x="162" y="156" fontSize="16" filter="url(#glowE)">⚙️</text>
    </svg>
  );

  const artWellness1 = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <radialGradient id="wG" cx="50%" cy="60%" r="50%"><stop offset="0%" stopColor={`${c}30`}/><stop offset="100%" stopColor="transparent"/></radialGradient>
        <filter id="glowW"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="170" cy="210" rx="120" ry="18" fill="url(#wG)"/>
      {/* Meditation figure */}
      <circle cx="170" cy="95" r="22" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <path d="M135 145 Q135 130 170 130 Q205 130 205 145 L200 180 L140 180 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      {/* Arms in meditation pose */}
      <path d="M140 155 Q110 155 105 145 Q100 135 115 130 Q125 127 135 135" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M200 155 Q230 155 235 145 Q240 135 225 130 Q215 127 205 135" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Lotus petals */}
      {[0,1,2,3,4,5,6,7].map(i=>{
        const a=(i/8)*Math.PI*2, r=55, cx2=170+r*Math.cos(a), cy2=210+r*0.3*Math.sin(a);
        return <ellipse key={i} cx={cx2} cy={cy2} rx="22" ry="40" fill={`${c}${i%2===0?'25':'15'}`} stroke={`${c}35`} strokeWidth="1" transform={`rotate(${i*45},${cx2},${cy2})`}/>;
      })}
      <circle cx="170" cy="210" r="20" fill={`${c}40`} filter="url(#glowW)"/>
      <text x="162" y="217" fontSize="14">🌸</text>
      {/* Aura rings */}
      {[35,50,65].map(r=>(
        <circle key={r} cx="170" cy="95" r={r} stroke={`${c}${20-r/5}`} strokeWidth="1" strokeDasharray="4 3"/>
      ))}
    </svg>
  );

  const artServices1 = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <filter id="glowS"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Central hub */}
      <circle cx="170" cy="150" r="30" fill={`${c}25`} stroke={c} strokeWidth="2" filter="url(#glowS)"/>
      <circle cx="170" cy="150" r="18" fill={`${c}40`}/>
      <text x="161" y="157" fontSize="16">🤝</text>
      {/* Outer nodes */}
      {[[170,55],[265,102],[265,198],[170,245],[75,198],[75,102]].map(([x,y],i)=>{
        const icons=['🏥','💊','🔬','🏠','⚙️','💆'];
        return (
          <g key={i} filter="url(#glowS)">
            <line x1={x} y1={y} x2="170" y2="150" stroke={`${c}${30+i*3}`} strokeWidth="1.5" strokeDasharray="5 3"/>
            <circle cx={x} cy={y} r="22" fill="rgba(255,255,255,0.08)" stroke={`${c}50`} strokeWidth="1.5"/>
            <text x={x-9} y={y+7} fontSize="15">{icons[i]}</text>
          </g>
        );
      })}
      {/* Mid-ring connection circle */}
      <circle cx="170" cy="150" r="78" stroke={`${c}15`} strokeWidth="1" strokeDasharray="3 4"/>
      {/* Activity dots on connection lines */}
      {[[170,103],[234,126],[234,175],[170,197],[106,175],[106,126]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="4" fill={`${c}60`} filter="url(#glowS)"/>
      ))}
    </svg>
  );

  // Org & admin art (shared)
  const artOrg = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <linearGradient id="bldG" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor={`${c}40`}/><stop offset="100%" stopColor={`${c}10`}/></linearGradient>
        <filter id="glowO"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Main building */}
      <rect x="90" y="100" width="160" height="165" rx="6" fill="url(#bldG)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      {/* Roof accent */}
      <rect x="90" y="100" width="160" height="28" rx="6" fill={`${c}30`}/>
      {/* Windows grid */}
      {[130,175,220].map(x=>[130,165,200].map(y=>(
        <rect key={`${x}${y}`} x={x-13} y={y-10} width="26" height="20" rx="3" fill="rgba(255,255,255,0.08)" stroke={`${c}30`} strokeWidth="1"/>
      )))}
      {/* Door */}
      <rect x="153" y="225" width="34" height="40" rx="4" fill={`${c}20`} stroke={`${c}40`} strokeWidth="1.5"/>
      <circle cx="183" cy="245" r="2.5" fill={`${c}60`}/>
      {/* Location pin */}
      <circle cx="245" cy="78" r="20" fill={`${c}30`} stroke={c} strokeWidth="1.5" filter="url(#glowO)"/>
      <circle cx="245" cy="74" r="10" fill={`${c}60`}/>
      <path d="M245 83 L245 100" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      {/* Side building (smaller) */}
      <rect x="255" y="155" width="55" height="110" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <rect x="30" y="170" width="55" height="95" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      {/* Ground line */}
      <line x1="25" y1="268" x2="315" y2="268" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      {/* Stars */}
      {[[55,80],[295,100],[45,250],[305,240]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="2.5" fill="rgba(255,255,255,0.4)" filter="url(#glowO)"/>
      ))}
    </svg>
  );

  const artAdmin = (
    <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
      <defs>
        <linearGradient id="shG" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor={`${c}50`}/><stop offset="100%" stopColor={`${c}20`}/></linearGradient>
        <filter id="glowA"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Shield */}
      <path d="M170 42 L235 70 L235 148 Q235 210 170 232 Q105 210 105 148 L105 70 Z" fill="url(#shG)" stroke={c} strokeWidth="2" filter="url(#glowA)"/>
      <path d="M170 52 L224 77 L224 148 Q224 202 170 221 Q116 202 116 148 L116 77 Z" fill={`${c}15`} stroke={`${c}40`} strokeWidth="1"/>
      {/* Check mark */}
      <path d="M138 142 L158 163 L205 115" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowA)"/>
      {/* User avatar */}
      <circle cx="170" cy="120" r="22" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <circle cx="170" cy="112" r="13" fill="rgba(255,255,255,0.15)"/>
      <path d="M145 138 Q145 128 170 128 Q195 128 195 138" fill="rgba(255,255,255,0.1)"/>
      {/* Orbiting security icons */}
      {[[170,258],[55,160],[285,160]].map(([x,y],i)=>{
        const icons=['🔑','🛡️','🔒'];
        return (
          <g key={i} filter="url(#glowA)">
            <circle cx={x} cy={y} r="20" fill="rgba(255,255,255,0.07)" stroke={`${c}40`} strokeWidth="1"/>
            <text x={x-9} y={y+7} fontSize="15">{icons[i]}</text>
          </g>
        );
      })}
      {/* Connection lines */}
      <line x1="170" y1="232" x2="170" y2="238" stroke={`${c}40`} strokeWidth="1.5"/>
      <line x1="108" y1="148" x2="75" y2="160" stroke={`${c}25`} strokeWidth="1.5"/>
      <line x1="232" y1="148" x2="265" y2="160" stroke={`${c}25`} strokeWidth="1.5"/>
      {/* Floating stars/sparkles */}
      {[[42,65],[298,70],[38,235],[302,230],[110,38],[230,38]].map(([x,y],i)=>(
        <g key={i} filter="url(#glowA)">
          <circle cx={x} cy={y} r={i<2?3:2} fill={`${c}80`}/>
        </g>
      ))}
    </svg>
  );

  const artByPortal: Record<string, React.ReactNode> = {
    clinical: artClinical1,
    diagnostic: artDiagnostic1,
    pharmacy: artPharmacy1,
    homecare: artHomecare1,
    equipment: artEquipment1,
    wellness: artWellness1,
    services: artServices1,
  };

  if(step===0) return {
    headline:'One platform for every healthcare provider',
    sub:'9 purpose-built portals. 231 practice types. WhatsApp-first automation from day one.',
    bullets:['Go live in under 7 days','No credit card required','HIPAA & DPDPA compliant'],
    art: artStep0,
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
    art: artByPortal[portal] || artStep0,
  };
  if(step===2 && portal==='diagnostic') return {
    headline:'How big is your diagnostic lab?',
    sub:'Choose the tier that matches your current scale. You can upgrade anytime as your lab grows.',
    bullets:['Features matched to your scale','Transparent pricing — no hidden charges','Upgrade anytime in settings'],
    art: artDiagnostic1,
  };
  if((step===2 && portal!=='diagnostic') || (step===3 && portal==='diagnostic')) return {
    headline:'Set up your organisation profile',
    sub:'This becomes your portal identity — visible to your patients, staff, and on all reports and invoices you generate.',
    bullets:['Appears on patient reports','Used for GST & billing','Portal URL: hospibot.in/your-slug'],
    art: artOrg,
  };
  return {
    headline:'Create your secure admin account',
    sub:'You\'ll use these credentials to log in and manage your portal. You can add more staff members after your account is set up.',
    bullets:['Role-based access control','Add unlimited staff','Change anytime in settings'],
    art: artAdmin,
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
  const [labTier, setLabTier] = useState<LabTier|''>('');
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
    setLabTier('');
    // Diagnostic portal gets an extra tier-selection step
    if(portal === 'diagnostic') {
      setTimeout(()=>go(2), 260);
    } else {
      setTimeout(()=>go(3), 260);
    }
  };

  const pickTier = (tier: LabTier) => {
    setLabTier(tier);
    if(tier === 'enterprise') {
      // Enterprise goes directly to contact form
      setTimeout(()=>go(3), 260);
    } else {
      setTimeout(()=>go(3), 260);
    }
  };

  const subtypeList = portal
    ? SUBS[portal].filter(s=>s.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const typeName = portal && subtype ? (SUBS[portal].find(s=>s.slug===subtype)?.name||subtype.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())) : '';

  const fi = (e:any) => { e.target.style.borderColor=c3; e.target.style.background='#fff'; e.target.style.boxShadow=`0 0 0 3px ${c3}25`; };
  const fo = (e:any) => { e.target.style.borderColor='#E2E8F0'; e.target.style.background='#F8FAFC'; e.target.style.boxShadow='none'; };

  const inputSt = {width:'100%',padding:'11px 14px',fontSize:15,borderRadius:10,border:'1.5px solid rgba(0,0,0,0.12)',background:'#fff',outline:'none',fontFamily:"'Poppins',sans-serif",transition:'all 0.18s',boxSizing:'border-box',color:'#0F172A',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'} as any;

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
        plan: labTier==='enterprise' ? 'ENTERPRISE' : labTier==='large' ? 'GROWTH' : 'STARTER',
        portalFamily:portal,subTypeSlug:subtype,
        labTier: labTier || undefined,
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


  /* Full-screen tier selection for Diagnostic portal */
  if(step===2 && portal==='diagnostic' && !showOthers) {

    // Each tier has its own distinct color identity
    const TIERS = [
      {
        id:'small', name:'Small Lab', sub:'Solo lab or sample collection center',
        color:'#0EA5E9', dark:'#0284C7', light:'#E0F2FE', bg:'linear-gradient(145deg,#0284C7,#0EA5E9)',
        price:'₹999', note:'/month',
        scale:{ samples:'1 – 50',staff:'1 – 5',branches:'1',tests:'Up to 1,500',credits:'500 / month'},
        features:['WhatsApp report delivery','Sample tracking & barcode','GST billing & invoices','Test catalog (500+ tests)','PDF report generation','Patient registration & lookup','Basic daily dashboard','Email support'],
        notIncluded:['Home collection management','Doctor CRM & referrals','QC module','NABL compliance tools','Multi-branch management'],
      },
      {
        id:'medium', name:'Medium Lab', sub:'Growing diagnostic center',
        color:'#10B981', dark:'#059669', light:'#D1FAE5', bg:'linear-gradient(145deg,#059669,#10B981)',
        price:'₹2,999', note:'/month',
        scale:{ samples:'50 – 200',staff:'5 – 20',branches:'1 – 3',tests:'Up to 6,000',credits:'2,000 / month'},
        features:['Everything in Small Lab','Home collection + GPS tracking','Doctor CRM & referral tracking','Corporate wellness screening','TPA / insurance claims','Package & combo billing','2,000 WhatsApp credits/month','Chat + email support'],
        notIncluded:['QC module (Westgard / L-J)','NABL compliance tools','Multi-branch management','Staff HRMS & payroll'],
      },
      {
        id:'large', name:'Large Lab', sub:'NABL-accredited city chain',
        color:'#8B5CF6', dark:'#7C3AED', light:'#EDE9FE', bg:'linear-gradient(145deg,#7C3AED,#8B5CF6)',
        price:'₹7,999', note:'/month',
        scale:{ samples:'200 – 1,000',staff:'20 – 100',branches:'3 – 15',tests:'Up to 30,000',credits:'5,000 / month'},
        features:['Everything in Medium Lab','QC module — Westgard + Levey-Jennings','NABL compliance documentation','Multi-branch management','Staff HRMS, attendance & payroll','HL7/ASTM analyser interface','Chain analytics dashboard','Priority support'],
        notIncluded:['Franchise management','Hub-spoke routing','Revenue sharing engine','White-label capability'],
      },
      {
        id:'enterprise', name:'Enterprise', sub:'Reference lab, hospital network, franchise',
        color:'#F59E0B', dark:'#D97706', light:'#FEF3C7', bg:'linear-gradient(145deg,#D97706,#F59E0B)',
        price:'Custom', note:'contact us',
        scale:{ samples:'1,000+',staff:'100+',branches:'15+',tests:'Unlimited',credits:'Unlimited'},
        features:['Everything in Large Lab','Franchise & hub-spoke management','Revenue sharing engine','White-label portal capability','API marketplace access','ABHA/ABDM deep integration','Unlimited WhatsApp credits','Dedicated account manager','SLA-backed uptime guarantee'],
        notIncluded:[],
      },
    ];

    const SCALE_ICONS:{[k:string]:string} = {
      samples:'🧪', staff:'👥', branches:'🏢', tests:'📋', credits:'💬',
    };
    const SCALE_LABELS:{[k:string]:string} = {
      samples:'Daily Samples', staff:'Staff', branches:'Branches', tests:'Monthly Tests', credits:'WhatsApp Credits',
    };

    return (
      <div style={{height:'calc(100vh - 64px)',display:'flex',flexDirection:'column',background:'#F1F5F9',fontFamily:"'Poppins',sans-serif",overflow:'hidden'}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          button{font-family:'Poppins',sans-serif;cursor:pointer}
          .tc{transition:transform 0.2s,box-shadow 0.2s}
          .tc:hover{transform:translateY(-2px)}
          .sel:hover{filter:brightness(1.06)}
          ::-webkit-scrollbar{width:5px}
          ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px}
          @keyframes cardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        `}</style>

        {/* NAV */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 28px',background:'#fff',borderBottom:'1px solid #E2E8F0',flexShrink:0}}>
          <button onClick={()=>go(1)} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#64748B',background:'none',border:'none',padding:0,fontWeight:500}}>
            <ArrowLeft size={13}/> Back
          </button>
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            {['Portal','Type','Size','Details','Account'].map((s,i)=>(
              <div key={s} style={{display:'flex',alignItems:'center',gap:3}}>
                <div style={{height:6,width:i<=2?18:6,borderRadius:99,background:i<=2?'#0D7C66':'#CBD5E1'}}/>
                {i<4&&<div style={{width:5,height:1,background:'#E2E8F0'}}/>}
              </div>
            ))}
            <span style={{fontSize:11,color:'#94A3B8',marginLeft:4}}>Step 3 of 5</span>
          </div>
          <a href="/auth/login" style={{fontSize:12.5,color:'#94A3B8',textDecoration:'none'}}>
            Have an account? <span style={{color:'#0D7C66',fontWeight:700}}>Sign in</span>
          </a>
        </div>

        {/* SINGLE SCROLL AREA */}
        <div style={{flex:1,overflow:'auto',padding:'0 20px 32px'}}>

          {/* Hero */}
          <div style={{textAlign:'center',padding:'20px 0 18px'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:99,padding:'4px 14px',fontSize:11.5,fontWeight:700,color:'#2563EB',marginBottom:10,letterSpacing:'0.04em'}}>
              🔬 {(subtype||'').replace(/-/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase())}
            </div>
            <h1 style={{fontSize:'clamp(20px,2.5vw,28px)',fontWeight:900,color:'#0F172A',letterSpacing:'-0.025em',marginBottom:4}}>
              Choose the right plan for your lab
            </h1>
            <p style={{fontSize:13,color:'#64748B'}}>
              All plans include a <strong style={{color:'#0F172A'}}>14-day free trial</strong>. No credit card required.
            </p>
          </div>

          {/* CARDS GRID */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,maxWidth:1100,margin:'0 auto 24px'}}>
            {TIERS.map((t,ti)=>{
              const selected = labTier===t.id;
              return (
                <div key={t.id} className="tc"
                  style={{background:'#fff',borderRadius:20,overflow:'hidden',boxShadow:selected?`0 12px 40px ${t.color}35`:'0 2px 16px rgba(0,0,0,0.07)',border:`2px solid ${selected?t.color:'transparent'}`,display:'flex',flexDirection:'column',
                    animation:`cardIn 0.35s ${ti*0.07}s ease both`,opacity:0,animationFillMode:'forwards'}}>

                  {/* Colored gradient header */}
                  <div style={{background:t.bg,padding:'18px 18px 16px',position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)',pointerEvents:'none'}}/>
                    <div style={{position:'absolute',bottom:-30,left:-10,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.06)',pointerEvents:'none'}}/>
                    <div style={{fontSize:11,fontWeight:800,color:'rgba(255,255,255,0.7)',textTransform:'uppercase' as const,letterSpacing:'0.1em',marginBottom:6}}>{t.name}</div>
                    <div style={{fontSize:11.5,color:'rgba(255,255,255,0.75)',marginBottom:12,lineHeight:1.4}}>{t.sub}</div>
                    <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                      <span style={{fontSize:t.id==='enterprise'?26:30,fontWeight:900,color:'#fff',lineHeight:1}}>{t.price}</span>
                      <span style={{fontSize:11,color:'rgba(255,255,255,0.65)'}}>{t.note}</span>
                    </div>
                  </div>

                  {/* ── SCALE OF OPERATIONS SECTION ── */}
                  <div style={{padding:'14px 16px',borderBottom:`1px solid ${t.light}`,background:`${t.light}50`}}>
                    <div style={{fontSize:10,fontWeight:800,color:t.dark,textTransform:'uppercase' as const,letterSpacing:'0.09em',marginBottom:10}}>
                      Scale of Operations
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                      {(Object.entries(t.scale) as [string,string][]).map(([k,v])=>(
                        <div key={k} style={{background:'#fff',borderRadius:9,padding:'7px 9px',border:`1px solid ${t.light}`}}>
                          <div style={{fontSize:9.5,color:'#94A3B8',fontWeight:600,marginBottom:2}}>{SCALE_ICONS[k]} {SCALE_LABELS[k]}</div>
                          <div style={{fontSize:12,fontWeight:700,color:v==='Unlimited'?t.dark:'#0F172A'}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── FEATURES SECTION ── */}
                  <div style={{padding:'12px 16px',flex:1}}>
                    <div style={{fontSize:10,fontWeight:800,color:t.dark,textTransform:'uppercase' as const,letterSpacing:'0.09em',marginBottom:9}}>
                      Features Included
                    </div>
                    <div style={{display:'flex',flexDirection:'column' as const,gap:6}}>
                      {t.features.map(f=>(
                        <div key={f} style={{display:'flex',alignItems:'flex-start',gap:8}}>
                          <div style={{width:16,height:16,borderRadius:5,background:`${t.color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                            <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M0.5 3.5L2.8 6L7.5 1" stroke={t.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          <span style={{fontSize:11.5,color:'#374151',lineHeight:1.4}}>{f}</span>
                        </div>
                      ))}
                    </div>

                    {t.notIncluded.length>0 && (
                      <div style={{marginTop:10,paddingTop:10,borderTop:`1px dashed ${t.light}`}}>
                        <div style={{fontSize:9.5,fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'0.07em',marginBottom:7}}>Not in this plan</div>
                        {t.notIncluded.map(f=>(
                          <div key={f} style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 1.5L7.5 7.5M7.5 1.5L1.5 7.5" stroke="#CBD5E1" strokeWidth="1.3" strokeLinecap="round"/></svg>
                            <span style={{fontSize:11,color:'#94A3B8',textDecoration:'line-through',textDecorationColor:'#E2E8F0'}}>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SELECT BUTTON */}
                  <div style={{padding:'12px 16px 16px'}}>
                    <button onClick={()=>pickTier(t.id as LabTier)} className="sel"
                      style={{width:'100%',padding:'10px 0',borderRadius:11,border:'none',fontSize:13,fontWeight:700,color:'#fff',
                        background: selected ? t.bg : `${t.color}cc`,
                        boxShadow: selected ? `0 4px 20px ${t.color}50` : `0 2px 8px ${t.color}25`,
                        transition:'all 0.18s'}}>
                      {selected ? 'Selected — Continue \u2192' : `Select ${t.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom note */}
          <div style={{textAlign:'center',fontSize:12,color:'#94A3B8'}}>
            All plans start with a 14-day free trial \u00b7 No credit card required \u00b7 Upgrade anytime
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN ────────────────────────────────────────────────────────────────── */
  return (
    <div style={{height:'calc(100vh - 64px)',display:'flex',overflow:'hidden',fontFamily:"'Poppins',sans-serif"}}>
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
            {(portal==='diagnostic'?['Portal','Type','Size','Details','Account']:['Portal','Type','Details','Account']).map((s,i)=>(
              <div key={s} style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:i<step?28:i===step?28:8,height:8,borderRadius:99,background:i<step?'rgba(255,255,255,0.9)':i===step?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.2)',transition:'all 0.4s ease'}}/>
              </div>
            ))}
            <span style={{marginLeft:8,fontSize:12.5,color:'rgba(255,255,255,0.5)',fontWeight:500}}>Step {step+1} of {portal==='diagnostic'?5:4}</span>
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
      <div style={{width:'50%',background: step===0 ? '#F0F4F8' : (pp?.light||'#F0F4F8'),display:'flex',flexDirection:'column',overflow:'hidden',position:'relative',transition:'background 0.6s ease'}}>
        {/* Step nav bar */}
        <div style={{padding:'14px 40px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid rgba(0,0,0,0.06)',flexShrink:0}}>
          {step>0 ? (
            <button onClick={()=>go(step-1)} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#64748B',background:'none',border:'none',cursor:'pointer',padding:'4px 0',fontFamily:"'Poppins',sans-serif"}}>
              <ArrowLeft size={14}/> Back
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
                    style={{textAlign:'left',padding:'18px 16px',borderRadius:16,border:`1.5px solid ${portal===slug?p.c3:'#E8EDF5'}`,background:portal===slug?`linear-gradient(145deg,#fff,${p.light})`:'#fff',cursor:'pointer',position:'relative',transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:portal===slug?`0 8px 24px ${p.c3}35`:'0 2px 8px rgba(0,0,0,0.08)',borderColor:portal===slug?p.c3:'rgba(255,255,255,0.9)'}}>
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
                    style={{textAlign:'left',padding:'13px',borderRadius:13,border:`1.5px solid ${subtype===s.slug?c2:'#E8EDF5'}`,background:subtype===s.slug?`linear-gradient(145deg,#fff,${pp.light})`:'#fff',cursor:'pointer',position:'relative',transition:'all 0.22s',boxShadow:subtype===s.slug?`0 6px 20px ${c3}30`:'0 2px 8px rgba(0,0,0,0.08)',borderColor:subtype===s.slug?c2:'rgba(0,0,0,0.06)'}}>
                    {s.popular&&subtype!==s.slug&&<span style={{position:'absolute',top:7,right:7,fontSize:9,fontWeight:700,background:'#FEF3C7',color:'#92400E',padding:'2px 6px',borderRadius:20}}>POPULAR</span>}
                    {subtype===s.slug&&<div style={{position:'absolute',top:7,right:7,width:18,height:18,borderRadius:'50%',background:c2,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:9,fontWeight:800}}>✓</div>}
                    <div style={{fontSize:22,marginBottom:7}}>{s.icon}</div>
                    <div style={{fontSize:12.5,fontWeight:700,color:'#0F172A',lineHeight:1.35,paddingRight:s.popular?18:0}}>{s.name}</div>
                  </button>
                ))}
                {/* Others card */}
                <button onClick={()=>pickSub('__others__')} className="sub-card"
                  style={{textAlign:'left',padding:'13px',borderRadius:13,border:'1.5px dashed #94A3B8',background:'#fff',cursor:'pointer',transition:'all 0.22s',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
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

          {((step===2 && portal!=='diagnostic') || (step===3 && portal==='diagnostic')) && pp && (
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
                <button onClick={()=>{if(!org.name||!org.phone||!org.city){toast.error('Name, Phone & City required');return;}go(portal==='diagnostic'?4:3);}}
                  style={{marginTop:8,padding:'13px',borderRadius:13,border:'none',background:`linear-gradient(135deg,${c1},${c2})`,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:`0 6px 20px ${c3}40`}}>
                  Continue to Admin Account →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Admin Account ─────────────────────────────────────── */}
          {((step===3 && portal!=='diagnostic') || (step===4 && portal==='diagnostic')) && pp && (
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
                <div style={{padding:'16px 18px',background:'#fff',borderRadius:14,border:'1px solid rgba(0,0,0,0.1)',marginTop:4,boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
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
