'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const META: Record<string,{name:string;color:string;dark:string;light:string;icon:string}> = {
  clinical:  {name:'Clinical Portal',   color:'#0D7C66',dark:'#065F46',light:'#ECFDF5',icon:'🩺'},
  diagnostic:{name:'Diagnostic Portal', color:'#1E40AF',dark:'#1E3A8A',light:'#EFF6FF',icon:'🔬'},
  pharmacy:  {name:'Pharmacy Portal',   color:'#15803D',dark:'#14532D',light:'#F0FDF4',icon:'💊'},
  homecare:  {name:'Home Care Portal',  color:'#B45309',dark:'#92400E',light:'#FFFBEB',icon:'🏠'},
  equipment: {name:'Equipment Portal',  color:'#6D28D9',dark:'#5B21B6',light:'#F5F3FF',icon:'⚙️'},
  wellness:  {name:'Wellness Portal',   color:'#BE185D',dark:'#9D174D',light:'#FFF1F2',icon:'💆'},
  services:  {name:'Services Portal',   color:'#0369A1',dark:'#0C4A6E',light:'#F0F9FF',icon:'🤝'},
};

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry'];

function inp(color:string) {
  return {
    width:'100%' as const,padding:'10px 14px',fontSize:13.5,
    borderRadius:10,border:'1.5px solid #E2E8F0',background:'#F8FAFC',
    outline:'none',fontFamily:"'Poppins',sans-serif",
    transition:'all 0.18s',boxSizing:'border-box' as const,color:'#0F172A',
  };
}

function FL({label,req,children}:{label:string;req?:boolean;children:React.ReactNode}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{fontSize:11.5,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.07em'}}>
        {label}{req&&<span style={{color:'#EF4444',marginLeft:3}}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function RegisterSubTypePage() {
  const params = useParams() as any;
  const familySlug: string = params?.family ?? '';
  const subTypeSlug: string = params?.subtype ?? '';
  const router = useRouter();
  const m = META[familySlug] || {name:'Portal',color:'#0D7C66',dark:'#065F46',light:'#ECFDF5',icon:'🏥'};

  const [step, setStep] = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [org, setOrg] = useState({name:'',slug:'',phone:'',email:'',address:'',city:'',state:'Telangana',pincode:'',gstNumber:''});
  const [admin, setAdmin] = useState({firstName:'',lastName:'',email:'',password:''});

  const slug = (n:string) => n.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-').slice(0,40);
  const oSet = (k:string)=>(e:any)=>setOrg(p=>({...p,[k]:e.target.value,...(k==='name'?{slug:slug(e.target.value)}:{})}));
  const aSet = (k:string)=>(e:any)=>setAdmin(p=>({...p,[k]:e.target.value}));
  const typeName = subTypeSlug.replace(/-/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase());

  const handle = async()=>{
    if(!admin.firstName||!admin.email||!admin.password){toast.error('Please fill all required fields');return;}
    setSubmitting(true);
    try{
      await api.post('/auth/register',{
        name:org.name,slug:org.slug,phone:org.phone,email:org.email||admin.email,
        address:org.address,city:org.city,state:org.state,country:'India',
        pincode:org.pincode,gstNumber:org.gstNumber,
        adminFirstName:admin.firstName,adminLastName:admin.lastName,
        adminEmail:admin.email,adminPassword:admin.password,
        plan:'STARTER',portalFamily:familySlug,subTypeSlug,
      });
      setSuccess(true);
    }catch(err:any){toast.error(err?.response?.data?.message||'Registration failed. Please try again.');}
    finally{setSubmitting(false);}
  };

  const focusSt = (e:any,color:string)=>{e.target.style.borderColor=color;e.target.style.background='#fff';e.target.style.boxShadow='0 0 0 3px '+color+'18';};
  const blurSt  = (e:any)=>{e.target.style.borderColor='#E2E8F0';e.target.style.background='#F8FAFC';e.target.style.boxShadow='none';};

  /* ── SUCCESS SCREEN ──────────────────────────────────────────────────── */
  if(success) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${m.light},#fff)`,fontFamily:"'Poppins',sans-serif",padding:24}}>
      <div style={{background:'#fff',borderRadius:24,padding:48,textAlign:'center',maxWidth:420,width:'100%',boxShadow:'0 20px 80px rgba(0,0,0,0.1)',border:'1px solid #E2E8F0'}}>
        <div style={{width:72,height:72,borderRadius:'50%',background:m.light,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
          <CheckCircle2 size={36} color={m.color}/>
        </div>
        <div style={{fontSize:32,marginBottom:8}}>🎉</div>
        <h2 style={{fontSize:22,fontWeight:800,color:'#0F172A',marginBottom:8}}>Account created!</h2>
        <p style={{fontSize:13.5,color:'#64748B',lineHeight:1.65,marginBottom:6}}><strong>{org.name||'Your organisation'}</strong> is now registered on <strong>{m.name}</strong>.</p>
        <p style={{fontSize:12.5,color:'#94A3B8',marginBottom:28}}>Your 14-day free trial has started — no credit card needed.</p>
        <button onClick={()=>router.push('/'+familySlug+'/login')}
          style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${m.color},${m.dark})`,color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:14.5,fontWeight:700,cursor:'pointer',boxShadow:`0 8px 24px ${m.color}44`,marginBottom:10}}>
          Sign in to {m.name} →
        </button>
        <p style={{fontSize:12,color:'#94A3B8'}}>Use the email & password you just created</p>
      </div>
    </div>
  );

  /* ── REGISTRATION FORM ───────────────────────────────────────────────── */
  return (
    <div style={{fontFamily:"'Poppins',sans-serif",minHeight:'100vh',background:'#F8FAFC'}}>

      {/* NAV */}
      <nav style={{background:'#fff',borderBottom:'1px solid #E2E8F0',padding:'0 32px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#0D7C66,#25D366)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:16}}>H</div>
          <span style={{fontWeight:800,fontSize:17,color:'#0F172A',letterSpacing:'-0.02em'}}>Hospi<span style={{color:'#0D7C66'}}>Bot</span></span>
        </a>
        <button onClick={()=>router.push('/register/'+familySlug)} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#64748B',background:'none',border:'1px solid #E2E8F0',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
          ← Change Type
        </button>
      </nav>

      <div style={{maxWidth:1060,margin:'0 auto',padding:'40px 24px',display:'flex',gap:40,alignItems:'flex-start'}}>

        {/* LEFT PANEL */}
        <div style={{width:260,flexShrink:0,position:'sticky',top:80,display:'flex',flexDirection:'column',gap:14}}>

          {/* Portal + subtype */}
          <div style={{padding:18,borderRadius:16,background:`linear-gradient(145deg,${m.color},${m.dark})`,color:'#fff'}}>
            <div style={{fontSize:28,marginBottom:8}}>{m.icon}</div>
            <div style={{fontWeight:800,fontSize:14,marginBottom:3}}>{m.name}</div>
            <div style={{fontSize:11.5,opacity:0.75,marginBottom:10}}>{typeName}</div>
            <div style={{height:1,background:'rgba(255,255,255,0.2)',marginBottom:10}}/>
            <div style={{fontSize:11,fontWeight:700,opacity:0.6,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>14-day Free Trial</div>
            <div style={{fontSize:12,opacity:0.85,lineHeight:1.55}}>Full access to all features. No credit card required.</div>
          </div>

          {/* Progress steps */}
          <div style={{padding:16,background:'#fff',border:'1px solid #E2E8F0',borderRadius:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:12}}>Your progress</div>
            {[
              {label:'Choose Portal',done:true},
              {label:'Select Type',done:true},
              {label:'Organisation Details',done:step>0,active:step===0},
              {label:'Admin Account',done:step>1,active:step===1},
              {label:'Go Live!',done:false},
            ].map((s,i)=>(
              <div key={s.label} style={{display:'flex',alignItems:'center',gap:10,marginBottom:i<4?10:0}}>
                <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,
                  background:s.done?m.color:s.active?m.light:'#F1F5F9',
                  color:s.done?'#fff':s.active?m.color:'#CBD5E1',
                  border:s.active?`2px solid ${m.color}`:'none'}}>
                  {s.done?'✓':i+1}
                </div>
                <span style={{fontSize:12.5,fontWeight:s.active?600:400,color:s.done||s.active?'#374151':'#94A3B8'}}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Trust */}
          <div style={{padding:14,background:'#fff',border:'1px solid #E2E8F0',borderRadius:14}}>
            {['🔒 Bank-grade encryption','🇮🇳 Servers in India','📱 Go live in 7 days','🛟 24/7 onboarding support'].map(t=>(
              <div key={t} style={{fontSize:12,color:'#374151',padding:'5px 0',borderBottom:'1px solid #F1F5F9'}}>{t}</div>
            ))}
          </div>
        </div>

        {/* RIGHT — FORM */}
        <div style={{flex:1,background:'#fff',borderRadius:20,border:'1px solid #E2E8F0',boxShadow:'0 4px 24px rgba(0,0,0,0.05)',overflow:'hidden'}}>

          {/* Form header */}
          <div style={{padding:'24px 28px',borderBottom:'1px solid #F1F5F9',background:m.light}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{fontSize:26}}>{step===0?'🏢':'👤'}</div>
              <div>
                <h2 style={{fontSize:18,fontWeight:800,color:'#0F172A',margin:0,letterSpacing:'-0.01em'}}>
                  {step===0?'Organisation Details':'Admin Account Setup'}
                </h2>
                <p style={{fontSize:12.5,color:'#64748B',margin:'3px 0 0',lineHeight:1.5}}>
                  {step===0?'Tell us about your healthcare facility':'Create the primary administrator login'}
                </p>
              </div>
              <div style={{marginLeft:'auto',fontSize:11.5,fontWeight:600,color:m.color,background:m.light,padding:'4px 10px',borderRadius:20,border:`1px solid ${m.color}30`}}>Step {step+1} of 2</div>
            </div>
          </div>

          <div style={{padding:'28px'}}>

          {/* ── STEP 0: ORG ─────────────────────────────────────────────── */}
          {step===0&&(
            <div style={{display:'flex',flexDirection:'column',gap:18}}>

              <FL label="Organisation Name" req>
                <input value={org.name} onChange={oSet('name')} placeholder="e.g. Apollo Diagnostics Hyderabad"
                  style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
              </FL>

              <FL label="Portal URL (your unique address)" req>
                <div style={{display:'flex',borderRadius:10,border:'1.5px solid #E2E8F0',overflow:'hidden',background:'#F8FAFC'}}>
                  <div style={{padding:'10px 12px',background:'#F1F5F9',borderRight:'1px solid #E2E8F0',fontSize:12.5,color:'#64748B',fontFamily:"'Poppins',sans-serif",whiteSpace:'nowrap',display:'flex',alignItems:'center'}}>
                    hospibot.in/
                  </div>
                  <input value={org.slug} onChange={oSet('slug')} placeholder="your-org-name"
                    style={{flex:1,padding:'10px 14px',fontSize:13.5,border:'none',background:'transparent',outline:'none',fontFamily:"'Poppins',sans-serif",color:'#0F172A'}}/>
                </div>
                <span style={{fontSize:11,color:'#94A3B8'}}>Cannot be changed after registration</span>
              </FL>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <FL label="Phone Number" req>
                  <input value={org.phone} onChange={oSet('phone')} placeholder="+91 9876543210"
                    style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
                </FL>
                <FL label="Organisation Email">
                  <input type="email" value={org.email} onChange={oSet('email')} placeholder="info@yourorg.com"
                    style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
                </FL>
              </div>

              <FL label="Street Address">
                <input value={org.address} onChange={oSet('address')} placeholder="Building, street, area"
                  style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
              </FL>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <FL label="City" req>
                  <input value={org.city} onChange={oSet('city')} placeholder="Hyderabad"
                    style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
                </FL>
                <FL label="State" req>
                  <select value={org.state} onChange={oSet('state')}
                    style={{...inp(m.color),cursor:'pointer'}}
                    onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}>
                    {STATES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </FL>
                <FL label="Pincode">
                  <input value={org.pincode} onChange={oSet('pincode')} placeholder="500001"
                    style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
                </FL>
              </div>

              <FL label="GST Number">
                <input value={org.gstNumber} onChange={oSet('gstNumber')} placeholder="29AAAAA0000A1Z5 (optional)"
                  style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
              </FL>

              <button onClick={()=>{
                if(!org.name||!org.phone||!org.city){toast.error('Please fill Organisation Name, Phone & City');return;}
                setStep(1);
              }} style={{marginTop:6,padding:'13px',borderRadius:13,border:'none',background:`linear-gradient(135deg,${m.color},${m.dark})`,color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:`0 6px 20px ${m.color}44`,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                Continue to Admin Account →
              </button>
            </div>
          )}

          {/* ── STEP 1: ADMIN ───────────────────────────────────────────── */}
          {step===1&&(
            <div style={{display:'flex',flexDirection:'column',gap:18}}>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <FL label="First Name" req>
                  <input value={admin.firstName} onChange={aSet('firstName')} placeholder="Vinod"
                    style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
                </FL>
                <FL label="Last Name">
                  <input value={admin.lastName} onChange={aSet('lastName')} placeholder="Kumar"
                    style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
                </FL>
              </div>

              <FL label="Admin Email Address" req>
                <input type="email" value={admin.email} onChange={aSet('email')} placeholder="admin@yourorg.com"
                  style={inp(m.color)} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
              </FL>

              <FL label="Password" req>
                <div style={{position:'relative'}}>
                  <input type={showPwd?'text':'password'} value={admin.password} onChange={aSet('password')} placeholder="Minimum 8 characters"
                    style={{...inp(m.color),paddingRight:44}} onFocus={e=>focusSt(e,m.color)} onBlur={blurSt}/>
                  <button type="button" onClick={()=>setShowPwd(v=>!v)}
                    style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94A3B8',display:'flex'}}>
                    {showPwd?<EyeOff size={16}/>:<Eye size={16}/>}
                  </button>
                </div>
              </FL>

              {/* Registration summary */}
              <div style={{padding:16,background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:14,marginTop:4}}>
                <div style={{fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>Registration Summary</div>
                {[
                  ['Portal',m.name],
                  ['Practice Type',typeName],
                  ['Organisation',org.name||'—'],
                  ['City',org.city||'—'],
                  ['Plan','14-day Free Trial'],
                ].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid #F1F5F9'}}>
                    <span style={{fontSize:12.5,color:'#64748B'}}>{k}</span>
                    <span style={{fontSize:12.5,fontWeight:600,color:k==='Plan'?m.color:'#0F172A'}}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(0)}
                  style={{flex:'0 0 auto',padding:'13px 20px',borderRadius:13,border:'1.5px solid #E2E8F0',background:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:13.5,fontWeight:600,cursor:'pointer',color:'#374151',display:'flex',alignItems:'center',gap:6}}>
                  ← Back
                </button>
                <button onClick={handle} disabled={submitting}
                  style={{flex:1,padding:'13px',borderRadius:13,border:'none',background:submitting?'#CBD5E1':`linear-gradient(135deg,${m.color},${m.dark})`,color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:14,fontWeight:700,cursor:submitting?'not-allowed':'pointer',boxShadow:submitting?'none':`0 6px 20px ${m.color}44`,transition:'all 0.2s'}}>
                  {submitting?'Creating your account…':'Create Account & Start Free Trial →'}
                </button>
              </div>

              <p style={{fontSize:11.5,color:'#94A3B8',textAlign:'center'}}>
                By registering you agree to our <span style={{textDecoration:'underline',cursor:'pointer'}}>Terms of Service</span> and <span style={{textDecoration:'underline',cursor:'pointer'}}>Privacy Policy</span>
              </p>
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}
