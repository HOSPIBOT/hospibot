'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

const FALLBACK: Record<string,Array<{slug:string;name:string;desc:string;icon:string}>> = {
  clinical:[
    {slug:'individual-doctor',name:'Individual Doctor / GP',icon:'👨‍⚕️',desc:'Solo practitioners & general physicians'},
    {slug:'specialist-doctor',name:'Specialist Doctor',icon:'🩻',desc:'Cardiologist, neurologist, orthopaedic & all specialists'},
    {slug:'multi-specialty-clinic',name:'Multi-Specialty Clinic',icon:'🏥',desc:'2–10 doctor clinics with multiple specialties'},
    {slug:'polyclinic',name:'Polyclinic',icon:'🏢',desc:'Large outpatient facilities with multiple departments'},
    {slug:'nursing-home',name:'Nursing Home (<30 beds)',icon:'🛏️',desc:'Small inpatient facilities with basic wards'},
    {slug:'hospital-mid',name:'Hospital (30–200 beds)',icon:'🏨',desc:'Mid-size hospitals with full departments'},
    {slug:'hospital-large',name:'Hospital (200+ beds)',icon:'🏛️',desc:'Large and super-specialty hospitals'},
    {slug:'ivf-fertility',name:'IVF / Fertility Center',icon:'🧬',desc:'IVF, IUI, fertility treatments & embryology'},
    {slug:'maternity-hospital',name:'Maternity Hospital',icon:'🤱',desc:'Birthing centers, maternity & gynecology'},
    {slug:'dental-clinic',name:'Dental Clinic',icon:'🦷',desc:'Dental, orthodontic & maxillofacial practices'},
    {slug:'eye-center',name:'Eye / Ophthalmology Center',icon:'👁️',desc:'Cataract, retina, LASIK & optometry'},
    {slug:'dermatologist',name:'Dermatologist / Cosmetologist',icon:'✨',desc:'Skin, hair, cosmetic & aesthetic clinics'},
    {slug:'physiotherapy',name:'Physiotherapy Clinic',icon:'🏃',desc:'Standalone physio, rehab & sports medicine'},
    {slug:'ayurveda',name:'Ayurveda / AYUSH Clinic',icon:'🌿',desc:'Ayurveda, Naturopathy, Homeopathy & traditional medicine'},
    {slug:'psychiatry',name:'Psychiatry / Mental Health',icon:'🧠',desc:'Psychiatry, psychology, counselling & de-addiction'},
    {slug:'dialysis',name:'Standalone Dialysis Center',icon:'💧',desc:'Nephrology & dialysis facilities'},
  ],
  diagnostic:[
    {slug:'pathology-lab',name:'Pathology / Blood Test Lab',icon:'🧪',desc:'Full-service pathology & haematology lab'},
    {slug:'sample-collection',name:'Sample Collection Center (PSC)',icon:'💉',desc:'Patient service center for sample collection'},
    {slug:'home-collection',name:'Home Sample Collection',icon:'🏠',desc:'Phlebotomist-based home collection service'},
    {slug:'radiology-center',name:'Radiology Center (X-Ray, CT, MRI)',icon:'📡',desc:'Diagnostic imaging and radiology'},
    {slug:'ultrasound-center',name:'Ultrasound Center',icon:'📊',desc:'USG, Doppler & sonography services'},
    {slug:'pet-scan',name:'PET Scan Center',icon:'⚛️',desc:'PET-CT and nuclear medicine imaging'},
    {slug:'cardiac-diagnostics',name:'Cardiac Diagnostics',icon:'❤️',desc:'Echo, TMT, Holter & cardiac stress tests'},
    {slug:'molecular-lab',name:'Molecular / PCR Lab',icon:'🔭',desc:'RT-PCR, NGS & molecular diagnostics'},
    {slug:'micro-lab',name:'Microbiological Lab',icon:'🦠',desc:'Cultures, sensitivity & microbiology'},
    {slug:'health-checkup',name:'Health Checkup Center',icon:'📋',desc:'Preventive health screening packages'},
    {slug:'corporate-screening',name:'Corporate Wellness Screening',icon:'🏢',desc:'Bulk employee health camps & screening'},
    {slug:'genetic-lab',name:'Genetic Testing Lab',icon:'🧬',desc:'Chromosomal analysis & genetic testing'},
    {slug:'reference-lab',name:'Reference / Central Lab',icon:'🏭',desc:'Large central processing & reference lab'},
    {slug:'tele-radiology',name:'Tele-Radiology Service',icon:'💻',desc:'Remote radiology reporting & teleradiology'},
  ],
  pharmacy:[
    {slug:'retail-pharmacy',name:'Retail Medical Store / Chemist',icon:'🏪',desc:'OTC and prescription medicines'},
    {slug:'hospital-pharmacy',name:'Hospital / Institutional Pharmacy',icon:'🏥',desc:'In-hospital pharmacy for inpatients & OPD'},
    {slug:'online-pharmacy',name:'Online Pharmacy / Home Delivery',icon:'📦',desc:'E-pharmacy with delivery & refill subscriptions'},
    {slug:'generic-store',name:'Generic Medicine Store (Jan Aushadhi)',icon:'🟢',desc:'Government Jan Aushadhi generic medicines'},
    {slug:'ayurvedic-store',name:'Ayurvedic / Herbal Medicine Store',icon:'🌿',desc:'AYUSH products & traditional preparations'},
    {slug:'compounding-pharmacy',name:'Compounding Pharmacy',icon:'⚗️',desc:'Custom medication preparation & formulations'},
    {slug:'oncology-pharmacy',name:'Oncology Pharmacy',icon:'🎗️',desc:'Chemotherapy drugs & cytotoxic handling'},
    {slug:'cold-chain-pharmacy',name:'Cold Chain / Specialty Pharmacy',icon:'❄️',desc:'Biologics, insulin, vaccines & cold storage'},
    {slug:'pharma-wholesale',name:'Pharmaceutical Wholesale / Distributor',icon:'🚚',desc:'Bulk supply to retailers, hospitals & institutions'},
  ],
  homecare:[
    {slug:'home-nursing',name:'Home Nursing Services',icon:'👩‍⚕️',desc:'Registered nurses for post-surgery & chronic care'},
    {slug:'home-physio',name:'Home Physiotherapy',icon:'🏃',desc:'Physio visits for ortho, neuro & geriatric patients'},
    {slug:'elder-care',name:'Elder Care / Geriatric Support',icon:'👴',desc:'Daily assistance, companionship & medical monitoring'},
    {slug:'icu-at-home',name:'ICU at Home',icon:'🏥',desc:'Critical care monitoring & ventilator support at home'},
    {slug:'mother-newborn',name:'Mother & Newborn Care',icon:'🤱',desc:'Postnatal care, lactation support & baby care'},
    {slug:'emergency-ambulance',name:'Emergency Ambulance Service',icon:'🚑',desc:'BLS/ALS ambulance & emergency transport'},
    {slug:'patient-transport',name:'Patient Transport (Non-Emergency)',icon:'🚐',desc:'Scheduled transport for dialysis, chemo & OPD visits'},
  ],
  equipment:[
    {slug:'diagnostic-imaging',name:'Diagnostic Imaging Equipment',icon:'📡',desc:'X-ray, MRI, CT, ultrasound & imaging systems'},
    {slug:'surgical-instruments',name:'Surgical Instruments & OT Equipment',icon:'🔬',desc:'Surgical tools, OT lights, tables & accessories'},
    {slug:'dental-equipment',name:'Dental Equipment & Supplies',icon:'🦷',desc:'Dental chairs, handpieces & dental supplies'},
    {slug:'lab-equipment',name:'Lab Equipment & Analyser',icon:'🧪',desc:'Auto-analysers, centrifuges & lab instruments'},
    {slug:'consumables',name:'Medical Consumables & Disposables',icon:'📦',desc:'Syringes, cannulas, masks & disposables'},
    {slug:'ot-icu-equipment',name:'ICU / OT Critical Equipment',icon:'❤️',desc:'Ventilators, patient monitors & defibrillators'},
  ],
  wellness:[
    {slug:'fitness-gym',name:'Fitness Center / Gym',icon:'💪',desc:'Gyms, CrossFit, strength & cardio training centers'},
    {slug:'yoga-studio',name:'Yoga Studio',icon:'🧘',desc:'Yoga, pranayama, meditation & mindfulness classes'},
    {slug:'nutrition-clinic',name:'Nutrition & Dietetics Clinic',icon:'🥗',desc:'Clinical dieticians, sports nutrition & weight management'},
    {slug:'spa-wellness',name:'Spa & Wellness Center',icon:'💆',desc:'Massages, body treatments & relaxation therapies'},
    {slug:'naturopathy',name:'Naturopathy Center',icon:'🌿',desc:'Hydrotherapy, mud therapy & natural healing'},
    {slug:'mental-wellness',name:'Mental Wellness Center',icon:'🧠',desc:'Mindfulness, stress management & wellbeing coaching'},
  ],
  services:[
    {slug:'healthcare-staffing',name:'Healthcare Staffing Agency',icon:'👥',desc:'Nurses, doctors, paramedics & admin staff placement'},
    {slug:'medical-billing',name:'Medical Billing & Coding',icon:'🧾',desc:'Billing outsourcing, TPA claims & revenue cycle management'},
    {slug:'tpa-insurance',name:'TPA / Insurance Services',icon:'🛡️',desc:'Third-party administration & health insurance processing'},
    {slug:'medical-tourism',name:'Medical Tourism Facilitator',icon:'✈️',desc:'International patient facilitation & healthcare tourism'},
    {slug:'hospital-consultancy',name:'Hospital Management Consultancy',icon:'📊',desc:'Hospital setup, accreditation & operations consulting'},
    {slug:'healthcare-it',name:'Healthcare IT Implementation',icon:'⚙️',desc:'HMS, EMR & health IT system implementation'},
  ],
};

const META: Record<string,{name:string;color:string;light:string;emoji:string}> = {
  clinical:  {name:'Clinical Portal',   color:'#0D7C66',light:'#E8F5F0',emoji:'🩺'},
  diagnostic:{name:'Diagnostic Portal', color:'#1E3A5F',light:'#EFF6FF',emoji:'🔬'},
  pharmacy:  {name:'Pharmacy Portal',   color:'#166534',light:'#F0FDF4',emoji:'💊'},
  homecare:  {name:'Home Care Portal',  color:'#B45309',light:'#FFFBEB',emoji:'🏠'},
  equipment: {name:'Equipment Portal',  color:'#6D28D9',light:'#F5F3FF',emoji:'⚕️'},
  wellness:  {name:'Wellness Portal',   color:'#BE185D',light:'#FDF2F8',emoji:'💆'},
  services:  {name:'Services Portal',   color:'#0369A1',light:'#F0F9FF',emoji:'🤝'},
};

export default function RegisterFamilyPage() {
  const params = useParams() as any;
  const familySlug = params?.family ?? '';
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [apiSubs, setApiSubs] = useState<any[]>([]);
  const meta = META[familySlug] || {name:'Portal',color:'#0D7C66',light:'#E8F5F0',emoji:'🏥'};
  const subtypes = apiSubs.length > 0 ? apiSubs : (FALLBACK[familySlug] || []);
  const filtered = subtypes.filter((s:any) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.desc||'').toLowerCase().includes(search.toLowerCase()));
  const sel = subtypes.find((s:any) => s.slug === selected);

  useEffect(() => {
    api.get('/portal/families/'+familySlug).then(r => {
      if (r.data?.subTypes?.length) setApiSubs(r.data.subTypes.map((s:any) => ({slug:s.slug,name:s.name,desc:s.description||'',icon:'🏥'})));
    }).catch(() => {});
  }, [familySlug]);

  const STEPS = ['Choose Portal','Select Type','Your Details','Go Live'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" style={{fontFamily:"'Poppins',sans-serif"}}>
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{background:'linear-gradient(135deg,#0D7C66,#25D366)'}}>H</div>
          <span className="font-extrabold text-slate-900 text-lg">Hospi<span style={{color:'#0D7C66'}}>Bot</span></span>
        </a>
        <button onClick={() => router.push('/register')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Change portal
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s,i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={i<1?{background:meta.color,color:'#fff'}:i===1?{background:meta.color,color:'#fff',boxShadow:'0 0 0 4px '+meta.light}:{background:'#F1F5F9',color:'#94A3B8'}}>
                  {i<1?'✓':i+1}
                </div>
                <span className={'text-sm font-medium hidden sm:block '+(i<=1?'text-slate-800':'text-slate-400')}>{s}</span>
              </div>
              {i<3 && <div className="w-6 h-px hidden sm:block" style={{background:i<1?meta.color:'#E2E8F0'}}/>}
            </div>
          ))}
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm" style={{borderColor:meta.color+'40',background:meta.light,color:meta.color}}>
            {meta.emoji} {meta.name}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">What best describes your practice?</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">Your selection customises HospiBot's features, templates and workflows for your exact needs.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search practice types..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none transition-all placeholder:text-slate-400"
            style={{focusBorderColor:meta.color} as any}
            onFocus={e => e.target.style.borderColor=meta.color}
            onBlur={e => e.target.style.borderColor='#E2E8F0'}/>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-10">
          {filtered.map((s:any) => {
            const active = selected === s.slug;
            return (
              <button key={s.slug} onClick={() => setSelected(s.slug)}
                className="relative text-left rounded-2xl border-2 p-4 transition-all duration-200 group"
                style={{
                  borderColor: active ? meta.color : '#E8EDF5',
                  background: active ? 'linear-gradient(145deg,'+meta.light+',#fff)' : '#fff',
                  boxShadow: active ? '0 6px 24px '+meta.color+'20' : '0 1px 3px rgba(0,0,0,.04)',
                  transform: active ? 'translateY(-2px)' : '',
                }}>
                {active && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{background:meta.color}}>✓</div>}
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">{s.icon||'🏥'}</div>
                <div className="font-semibold text-slate-900 text-sm mb-1 pr-6 leading-tight">{s.name}</div>
                {s.desc && <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">{s.desc}</div>}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm text-slate-400">No results for "{search}"</p>
              <button onClick={() => setSearch('')} className="text-xs underline mt-1" style={{color:meta.color}}>Clear</button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <button onClick={() => selected && router.push('/register/'+familySlug+'/'+selected)}
            disabled={!selected}
            className="flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-base text-white transition-all"
            style={{
              background: selected ? 'linear-gradient(135deg,'+meta.color+','+meta.color+'cc)' : '#CBD5E1',
              boxShadow: selected ? '0 8px 32px '+meta.color+'40' : 'none',
              cursor: selected ? 'pointer' : 'not-allowed',
              transform: selected ? 'scale(1.02)' : 'none',
            }}>
            {selected ? <>Continue as {sel?.name} <ArrowRight className="w-4 h-4"/></> : 'Select your practice type to continue'}
          </button>
          <p className="text-xs text-slate-400">You can add more practice types after registration</p>
        </div>
      </div>
    </div>
  );
}
