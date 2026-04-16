'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const PORTALS = [
  { slug:'clinical',  name:'Clinical Portal',    emoji:'🩺', color:'#0D7C66', light:'#E8F5F0', desc:'Hospitals, clinics, doctors & specialists',       count:'86 types' },
  { slug:'diagnostic',name:'Diagnostic Portal',  emoji:'🔬', color:'#1E3A5F', light:'#EFF6FF', desc:'Pathology, radiology, PCR & home collection',      count:'20 types' },
  { slug:'pharmacy',  name:'Pharmacy Portal',    emoji:'💊', color:'#166534', light:'#F0FDF4', desc:'Retail, hospital, online & specialty pharmacy',     count:'14 types' },
  { slug:'homecare',  name:'Home Care Portal',   emoji:'🏠', color:'#B45309', light:'#FFFBEB', desc:'Home nursing, physio, elder care & ambulance',      count:'16 types' },
  { slug:'equipment', name:'Equipment Portal',   emoji:'⚕️',  color:'#6D28D9', light:'#F5F3FF', desc:'Medical devices, imaging & surgical supply',        count:'18 types' },
  { slug:'wellness',  name:'Wellness Portal',    emoji:'💆', color:'#BE185D', light:'#FDF2F8', desc:'Fitness, yoga, nutrition & holistic health',        count:'18 types' },
  { slug:'services',  name:'Services Portal',    emoji:'🤝', color:'#0369A1', light:'#F0F9FF', desc:'Staffing, billing, TPA & consultancy',              count:'20 types' },
];

function StepBar({ step }: { step: number }) {
  const steps = ['Choose Portal', 'Select Type', 'Your Details', 'Go Live'];
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={i < step ? {background:'#0D7C66',color:'#fff'} : i===step ? {background:'#0D7C66',color:'#fff',boxShadow:'0 0 0 4px #E8F5F0'} : {background:'#F1F5F9',color:'#94A3B8'}}>
              {i < step ? '✓' : i+1}
            </div>
            <span className={"text-sm font-medium hidden sm:block " + (i <= step ? 'text-slate-800' : 'text-slate-400')}>{s}</span>
          </div>
          {i < 3 && <div className="w-6 h-px hidden sm:block" style={{background: i < step ? '#0D7C66' : '#E2E8F0'}} />}
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const portal = PORTALS.find(p => p.slug === selected);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" style={{fontFamily:"'Poppins',sans-serif"}}>
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{background:'linear-gradient(135deg,#0D7C66,#25D366)'}}>H</div>
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">Hospi<span style={{color:'#0D7C66'}}>Bot</span></span>
        </a>
        <span className="text-sm text-slate-500">Already registered? <a href="/auth/login" className="font-semibold" style={{color:'#0D7C66'}}>Sign in →</a></span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <StepBar step={0} />
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">What type of healthcare provider are you?</h1>
          <p className="text-slate-500 text-base max-w-lg mx-auto">Each portal has purpose-built workflows for your specific operations. Pick the one that fits your practice.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {PORTALS.map(p => {
            const active = selected === p.slug;
            return (
              <button key={p.slug} onClick={() => setSelected(p.slug)}
                className="relative text-left rounded-2xl border-2 p-5 transition-all duration-200"
                style={{
                  borderColor: active ? p.color : '#E2E8F0',
                  background: active ? 'linear-gradient(145deg,'+p.light+',#fff)' : '#fff',
                  boxShadow: active ? '0 8px 32px '+p.color+'25' : '0 1px 4px rgba(0,0,0,.04)',
                  transform: active ? 'translateY(-3px) scale(1.02)' : '',
                }}>
                {active && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{background:p.color}}>✓</div>}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform" style={{background:active ? p.color+'18' : '#F8FAFC'}}>{p.emoji}</div>
                <div className="font-bold text-slate-900 text-sm mb-1">{p.name}</div>
                <div className="text-xs text-slate-500 mb-3 leading-relaxed">{p.desc}</div>
                <div className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{background:p.light,color:p.color}}>{p.count}</div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button onClick={() => selected && router.push('/register/'+selected)} disabled={!selected}
            className="px-10 py-4 rounded-2xl font-bold text-base text-white transition-all"
            style={{
              background: selected ? 'linear-gradient(135deg,'+portal?.color+','+portal?.color+'bb)' : '#CBD5E1',
              boxShadow: selected ? '0 8px 32px '+portal?.color+'40' : 'none',
              cursor: selected ? 'pointer' : 'not-allowed',
              transform: selected ? 'scale(1.02)' : 'none',
            }}>
            {selected ? 'Continue with '+portal?.name+' →' : 'Select a portal to continue'}
          </button>
          <p className="text-xs text-slate-400">14-day free trial · No credit card required · HIPAA &amp; DPDPA compliant</p>
        </div>
      </div>
    </div>
  );
}
