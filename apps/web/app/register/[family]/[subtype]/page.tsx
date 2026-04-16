'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, CheckCircle2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry'];

const META: Record<string,{name:string;color:string;dark:string;light:string;emoji:string}> = {
  clinical:  {name:'Clinical Portal',   color:'#0D7C66',dark:'#0A5E4F',light:'#E8F5F0',emoji:'🩺'},
  diagnostic:{name:'Diagnostic Portal', color:'#1E3A5F',dark:'#152A47',light:'#EFF6FF',emoji:'🔬'},
  pharmacy:  {name:'Pharmacy Portal',   color:'#166534',dark:'#14532D',light:'#F0FDF4',emoji:'💊'},
  homecare:  {name:'Home Care Portal',  color:'#B45309',dark:'#92400E',light:'#FFFBEB',emoji:'🏠'},
  equipment: {name:'Equipment Portal',  color:'#6D28D9',dark:'#5B21B6',light:'#F5F3FF',emoji:'⚕️'},
  wellness:  {name:'Wellness Portal',   color:'#BE185D',dark:'#9D174D',light:'#FDF2F8',emoji:'💆'},
  services:  {name:'Services Portal',   color:'#0369A1',dark:'#075985',light:'#F0F9FF',emoji:'🤝'},
};

function Field({label,required,error,children}:{label:string;required?:boolean;error?:string;children:React.ReactNode}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-1 normal-case font-normal">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Input({value,onChange,placeholder,type='text',disabled,color,required}: any) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} required={required}
      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
      onFocus={e => { e.target.style.borderColor = color; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px '+color+'18'; }}
      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

export default function RegisterSubTypePage() {
  const params = useParams() as any;
  const familySlug = params?.family ?? '';
  const subTypeSlug = params?.subtype ?? '';
  const router = useRouter();

  const meta = META[familySlug] || {name:'Portal',color:'#0D7C66',dark:'#0A5E4F',light:'#E8F5F0',emoji:'🏥'};

  const [step, setStep] = useState(0); // 0=org, 1=admin
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [org, setOrg] = useState({ name:'', slug:'', phone:'', email:'', address:'', city:'', state:'Telangana', pincode:'', country:'India', gstNumber:'' });
  const [admin, setAdmin] = useState({ firstName:'', lastName:'', email:'', password:'' });

  const autoSlug = (n:string) => n.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-').slice(0,40);

  const setO = (k:string) => (e:any) => setOrg(p => ({ ...p, [k]:e.target.value, ...(k==='name'?{slug:autoSlug(e.target.value)}:{}) }));
  const setA = (k:string) => (e:any) => setAdmin(p => ({ ...p, [k]:e.target.value }));

  const handleSubmit = async () => {
    if (!admin.firstName || !admin.email || !admin.password) {
      toast.error('Please fill all required fields'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        name: org.name, slug: org.slug, phone: org.phone, email: org.email || admin.email,
        address: org.address, city: org.city, state: org.state,
        country: org.country, pincode: org.pincode, gstNumber: org.gstNumber,
        adminFirstName: admin.firstName, adminLastName: admin.lastName,
        adminEmail: admin.email, adminPassword: admin.password,
        plan: 'STARTER', portalFamily: familySlug, subTypeSlug,
      });
      setSuccess(true);
    } catch (err:any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const subtypeName = subTypeSlug.replace(/-/g,' ').replace(/\b\w/g,(c:string) => c.toUpperCase());
  const STEPS = ['Organisation Details', 'Admin Account'];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{background:'linear-gradient(135deg,'+meta.light+',#fff)',fontFamily:"'Poppins',sans-serif"}}>
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full shadow-2xl border border-slate-100">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{background:meta.light}}>
            <CheckCircle2 className="w-10 h-10" style={{color:meta.color}}/>
          </div>
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">You&apos;re all set!</h2>
          <p className="text-slate-500 text-sm mb-2">Your <strong>{meta.name}</strong> account has been created successfully.</p>
          <p className="text-slate-400 text-xs mb-8">Your 14-day free trial has started. No credit card required.</p>
          <button onClick={() => router.push('/'+familySlug+'/login')}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-lg mb-3"
            style={{background:'linear-gradient(135deg,'+meta.color+','+meta.dark+')'}}>
            Sign in to {meta.name} →
          </button>
          <p className="text-xs text-slate-400">Use the email and password you just created</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" style={{fontFamily:"'Poppins',sans-serif"}}>
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{background:'linear-gradient(135deg,#0D7C66,#25D366)'}}>H</div>
          <span className="font-extrabold text-slate-900 text-lg">Hospi<span style={{color:'#0D7C66'}}>Bot</span></span>
        </a>
        <button onClick={() => router.push('/register/'+familySlug)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4"/> Change type
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {['Choose Portal','Select Type','Your Details','Go Live'].map((s,i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={i<2?{background:meta.color,color:'#fff'}:i===2?{background:meta.color,color:'#fff',boxShadow:'0 0 0 4px '+meta.light}:{background:'#F1F5F9',color:'#94A3B8'}}>
                  {i<2?'✓':i+1}
                </div>
                <span className={'text-sm font-medium hidden sm:block '+(i<=2?'text-slate-800':'text-slate-400')}>{s}</span>
              </div>
              {i<3 && <div className="w-6 h-px hidden sm:block" style={{background:i<2?meta.color:'#E2E8F0'}}/>}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 p-4 rounded-2xl border" style={{borderColor:meta.color+'30',background:meta.light}}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{background:meta.color+'15'}}>{meta.emoji}</div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{meta.name}</div>
            <div className="text-xs text-slate-500">{subtypeName}</div>
          </div>
          <div className="ml-auto text-xs font-semibold px-3 py-1 rounded-full" style={{background:meta.color+'15',color:meta.color}}>14-day free trial</div>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-slate-100 rounded-2xl">
          {STEPS.map((s,i) => (
            <button key={s} onClick={() => i < step + 1 && setStep(i)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={step === i ? {background:'#fff',color:meta.color,boxShadow:'0 2px 8px rgba(0,0,0,.08)'} : {color:i <= step ? '#64748B' : '#94A3B8'}}>
              {i < step ? '✓ ' : ''}{s}
            </button>
          ))}
        </div>

        {/* Step 0: Organisation */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-slate-900">Tell us about your organisation</h2>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Organisation Name" required>
                <Input value={org.name} onChange={setO('name')} placeholder="e.g. Apollo Diagnostics Hyderabad" color={meta.color} required/>
              </Field>
              <Field label="Portal URL Slug" required>
                <div className="flex items-center gap-0 rounded-xl border border-slate-200 overflow-hidden bg-slate-50"
                  onFocus={e => { (e.currentTarget as any).style.borderColor = meta.color; (e.currentTarget as any).style.boxShadow = '0 0 0 3px '+meta.color+'18'; }}
                  onBlur={e => { (e.currentTarget as any).style.borderColor = '#E2E8F0'; (e.currentTarget as any).style.boxShadow = 'none'; }}>
                  <span className="px-3 py-2.5 text-xs text-slate-400 bg-slate-100 border-r border-slate-200 font-mono whitespace-nowrap">hospibot.in/</span>
                  <input value={org.slug} onChange={setO('slug')} placeholder="your-lab-name"
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400"/>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Unique identifier — cannot be changed later</p>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone Number" required>
                  <Input value={org.phone} onChange={setO('phone')} placeholder="+91 9876543210" color={meta.color}/>
                </Field>
                <Field label="Organisation Email">
                  <Input type="email" value={org.email} onChange={setO('email')} placeholder="info@yourlab.com" color={meta.color}/>
                </Field>
              </div>
              <Field label="Address">
                <Input value={org.address} onChange={setO('address')} placeholder="Street address" color={meta.color}/>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" required>
                  <Input value={org.city} onChange={setO('city')} placeholder="Hyderabad" color={meta.color}/>
                </Field>
                <Field label="State" required>
                  <select value={org.state} onChange={setO('state')}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none transition-all cursor-pointer"
                    onFocus={e => { e.target.style.borderColor=meta.color; e.target.style.background='#fff'; }}
                    onBlur={e => { e.target.style.borderColor='#E2E8F0'; e.target.style.background='#F8FAFC'; }}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Pincode">
                  <Input value={org.pincode} onChange={setO('pincode')} placeholder="500001" color={meta.color}/>
                </Field>
                <Field label="GST Number">
                  <Input value={org.gstNumber} onChange={setO('gstNumber')} placeholder="29AAAAA0000A1Z5" color={meta.color}/>
                </Field>
              </div>
            </div>
            <button onClick={() => {
              if (!org.name || !org.phone || !org.city) { toast.error('Please fill Organisation Name, Phone & City'); return; }
              setStep(1);
            }} className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 mt-2"
              style={{background:'linear-gradient(135deg,'+meta.color+','+meta.dark+')'}}>
              Continue to Admin Account <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        )}

        {/* Step 1: Admin Account */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-slate-900">Create your admin account</h2>
            <p className="text-sm text-slate-500 -mt-2">This will be the primary admin login for your portal.</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" required>
                <Input value={admin.firstName} onChange={setA('firstName')} placeholder="Vinod" color={meta.color}/>
              </Field>
              <Field label="Last Name">
                <Input value={admin.lastName} onChange={setA('lastName')} placeholder="Kumar" color={meta.color}/>
              </Field>
            </div>
            <Field label="Admin Email" required>
              <Input type="email" value={admin.email} onChange={setA('email')} placeholder="admin@yourlab.com" color={meta.color}/>
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Input type={showPwd ? 'text' : 'password'} value={admin.password} onChange={setA('password')} placeholder="Min. 8 characters" color={meta.color}/>
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </Field>

            {/* Summary */}
            <div className="p-4 rounded-2xl border bg-slate-50 border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Registration Summary</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Portal</span><span className="font-semibold text-slate-800">{meta.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-semibold text-slate-800">{subtypeName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Organisation</span><span className="font-semibold text-slate-800">{org.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="font-semibold" style={{color:meta.color}}>14-day Free Trial</span></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm transition-all hover:border-slate-300">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-2 flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style={{background:'linear-gradient(135deg,'+meta.color+','+meta.dark+')'}}>
                {submitting ? 'Creating account…' : 'Create Account & Start Trial →'}
              </button>
            </div>
            <p className="text-center text-xs text-slate-400">
              By registering you agree to our <span className="underline cursor-pointer">Terms</span> &amp; <span className="underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
