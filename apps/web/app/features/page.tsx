import Link from 'next/link';
export default function Page() {
  return (
    <div style={{fontFamily:"'Poppins',sans-serif",minHeight:'100vh',background:'#F8FAFC'}}>
      <section style={{background:'linear-gradient(160deg,#0F172A,#1E293B)',padding:'80px clamp(20px,5vw,80px) 72px',textAlign:'center' as const}}>
        <h1 style={{fontSize:'clamp(28px,4vw,52px)',fontWeight:900,color:'#fff',marginBottom:16,letterSpacing:'-0.02em'}}>Coming Soon</h1>
        <p style={{fontSize:17,color:'rgba(255,255,255,0.6)',maxWidth:560,margin:'0 auto 32px',lineHeight:1.7}}>
          Explore our portals or get in touch with our team.
        </p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' as const}}>
          <Link href="/register" style={{padding:'13px 28px',borderRadius:12,background:'#0D7C66',color:'#fff',fontWeight:700,fontSize:15,textDecoration:'none'}}>Get Started Free</Link>
          <Link href="/" style={{padding:'13px 28px',borderRadius:12,background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.8)',fontWeight:600,fontSize:15,textDecoration:'none',border:'1px solid rgba(255,255,255,0.15)'}}>← Home</Link>
        </div>
      </section>
    </div>
  );
}
