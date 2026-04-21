'use client';

import { useState, useEffect, useRef } from 'react';
import { PortalPageData } from '@/lib/portal-pages-data';

const NAVY = '#0A1628';
const LIGHT = '#F0FAF7';

function useOnScreen(ref: any, threshold = 0.12) {
  const [v, setV] = useState(false);
  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold }); if (ref.current) o.observe(ref.current); return () => o.disconnect(); }, [ref, threshold]);
  return v;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const v = useOnScreen(ref);
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>{children}</div>;
}

function Check({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="8" cy="8" r="8" fill={`${color}15`} /><path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>;
}

export default function PortalDetailPage({ data }: { data: PortalPageData }) {
  const [annual, setAnnual] = useState(true);
  const c = data.color;

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", color: NAVY }}>



      {/* HERO */}
      <section style={{ background: `linear-gradient(165deg, ${NAVY} 0%, #0F2847 60%, ${c}15 100%)`, padding: '40px 40px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${c}12, transparent)` }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
          <FadeIn>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: `${c}15`, border: `1px solid ${c}30`, borderRadius: 100, padding: '6px 18px 6px 10px', marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>{data.icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>{data.name}</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -1.5, margin: '0 0 20px', maxWidth: 700 }}>{data.tagline}</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 32px', maxWidth: 600 }}>{data.heroDesc}</p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', gap: 14 }}>
              <a href={data.registerPath} style={{ background: `linear-gradient(135deg, ${c}, ${c}DD)`, color: '#fff', padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none', boxShadow: `0 8px 30px ${c}40` }}>Start free trial</a>
              <a href="#features" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Explore features</a>
            </div>
          </FadeIn>
          <FadeIn delay={0.4}>
            <div style={{ display: 'flex', gap: 48, marginTop: 52 }}>
              {data.stats.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 38, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* WHO IS THIS FOR */}
      <section style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: c, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Who is this for</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: NAVY, letterSpacing: -0.8, marginBottom: 48 }}>Built for every type of {data.name.replace(' Portal', '').toLowerCase()} provider</h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {data.audience.map((a, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div style={{ border: '1px solid #E8ECF0', borderRadius: 14, padding: 24, transition: 'all 0.3s', height: '100%' }}
                  onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = c; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = '#E8ECF0'; e.currentTarget.style.transform = 'none'; }}>
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>{a.icon}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{a.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{a.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '80px 40px', background: '#F8FAFB' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: c, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Features</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: NAVY, letterSpacing: -0.8, marginBottom: 48 }}>Everything you need to run your {data.name.replace(' Portal', '').toLowerCase()} practice</h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {data.features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 14, padding: 24, display: 'flex', gap: 16, transition: 'all 0.2s' }}
                  onMouseEnter={(e: any) => e.currentTarget.style.borderColor = c}
                  onMouseLeave={(e: any) => e.currentTarget.style.borderColor = '#E8ECF0'}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${c}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: c, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Benefits</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: NAVY, letterSpacing: -0.8, marginBottom: 48 }}>Why healthcare providers choose HospiBot</h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {data.benefits.map((b, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{ background: `${c}08`, borderRadius: 14, padding: 24, borderLeft: `3px solid ${c}` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{b.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* GROWTH */}
      <section style={{ padding: '80px 40px', background: `linear-gradient(135deg, ${NAVY}, #0F2847)` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: `${c}CC`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Growth</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 48 }}>Scale your practice with HospiBot</h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {data.growth.map((g, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>{g.icon}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{g.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{g.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* SUBTYPES */}
      <section id="subtypes" style={{ padding: '80px 40px', background: '#F8FAFB' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: c, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Subtypes</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: NAVY, letterSpacing: -0.8, marginBottom: 48 }}>Specialized for every type of {data.name.replace(' Portal', '').toLowerCase()} facility</h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {data.subtypes.map((s, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}
                  onMouseEnter={(e: any) => e.currentTarget.style.borderColor = c}
                  onMouseLeave={(e: any) => e.currentTarget.style.borderColor = '#E8ECF0'}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.desc}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: c, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textAlign: 'center' }}>Pricing</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: NAVY, letterSpacing: -0.8, marginBottom: 12, textAlign: 'center' }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 24 }}>Start free for 14 days. No credit card required.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
              <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 100, padding: 4 }}>
                <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', borderRadius: 100, border: 'none', background: !annual ? NAVY : 'transparent', color: !annual ? '#fff' : '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Monthly</button>
                <button onClick={() => setAnnual(true)} style={{ padding: '8px 20px', borderRadius: 100, border: 'none', background: annual ? NAVY : 'transparent', color: annual ? '#fff' : '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Annual <span style={{ background: `${c}15`, color: c, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 100, marginLeft: 4 }}>SAVE 17%</span>
                </button>
              </div>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
            {data.pricing.map((p, i) => {
              const feat = p.badge === 'Most popular';
              const price = annual ? p.annual : p.price;
              return (
                <FadeIn key={i} delay={i * 0.08}>
                  <div style={{ background: '#fff', borderRadius: 18, border: feat ? `2px solid ${c}` : '1px solid #E8ECF0', overflow: 'hidden', transform: feat ? 'scale(1.03)' : 'none', boxShadow: feat ? `0 12px 40px ${c}12` : '0 2px 8px rgba(0,0,0,0.03)' }}>
                    {p.badge && <div style={{ background: feat ? c : NAVY, color: '#fff', textAlign: 'center', padding: '5px 0', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{p.badge}</div>}
                    <div style={{ padding: '24px 22px' }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 4 }}>{p.name}</h3>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 18, minHeight: 32 }}>{p.desc}</p>
                      {price ? (
                        <div style={{ marginBottom: 20 }}>
                          <span style={{ fontSize: 36, fontWeight: 800, color: NAVY }}>₹{price.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: 13, color: '#94A3B8' }}>/mo</span>
                          {annual && p.annual && <div style={{ fontSize: 11, color: c, fontWeight: 600, marginTop: 3 }}>Billed ₹{(p.annual * 12).toLocaleString('en-IN')}/yr</div>}
                        </div>
                      ) : <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 20 }}>Custom</div>}
                      <a href={price ? data.registerPath : '#'} style={{ display: 'block', width: '100%', padding: '11px 0', borderRadius: 8, border: feat ? 'none' : '1px solid #E8ECF0', background: feat ? `linear-gradient(135deg, ${c}, ${c}DD)` : '#F8FAFB', color: feat ? '#fff' : NAVY, fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none', marginBottom: 20, boxSizing: 'border-box' }}>{p.cta || 'Start free trial'}</a>
                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                        {p.features.map((f: string, fi: number) => (
                          <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 9 }}>
                            <Check color={c} />
                            <span style={{ fontSize: 12, color: '#475569' }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px', background: `linear-gradient(135deg, ${c}12, ${c}05)` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <FadeIn>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: NAVY, letterSpacing: -0.8, marginBottom: 14 }}>Ready to get started?</h2>
            <p style={{ fontSize: 16, color: '#64748B', marginBottom: 32 }}>Join hundreds of {data.name.replace(' Portal', '').toLowerCase()} providers already using HospiBot. 14-day free trial, no credit card.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <a href={data.registerPath} style={{ background: `linear-gradient(135deg, ${c}, ${c}DD)`, color: '#fff', padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none', boxShadow: `0 6px 24px ${c}30` }}>Register your portal free</a>
              <a href={data.loginPath} style={{ background: '#fff', border: '1px solid #E0E0E0', color: NAVY, padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Login to dashboard</a>
            </div>
          </FadeIn>
        </div>
      </section>


    </div>
  );
}
