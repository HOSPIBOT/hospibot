'use client';

import { useState, useEffect, useRef } from "react";

const TEAL = "#0D7C66";
const NAVY = "#0A1628";
const LIGHT = "#F0FAF7";

const pages = ["Home", "Features", "Solutions", "Pricing", "About", "Contact"];

function useOnScreen(ref: any, threshold = 0.15) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [ref, threshold]);
  return vis;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useOnScreen(ref);
  return (
    <div ref={ref} className={className} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(32px)", transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

function Nav({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(10,22,40,0.95)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", transition: "all 0.4s", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage("Home")}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${TEAL}, #14B88C)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>H</div>
          <span style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>Hospi<span style={{ color: TEAL }}>Bot</span></span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-nav-btn" style={{ display: "none", background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>☰</button>
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pages.map(p => (
            <button key={p} onClick={() => { setPage(p); setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{ background: "none", border: "none", color: page === p ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: page === p ? 600 : 400, cursor: "pointer", padding: "8px 16px", borderRadius: 8, transition: "all 0.2s", position: "relative" }}>
              {p}
              {page === p && <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 20, height: 2, background: TEAL, borderRadius: 2 }} />}
            </button>
          ))}
        </div>
        <div className="nav-cta" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => window.location.href = '/diagnostic/login'} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>Login</button>
          <button onClick={() => window.location.href = '/register'} style={{ background: `linear-gradient(135deg, ${TEAL}, #14B88C)`, border: "none", color: "#fff", padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: `0 4px 20px ${TEAL}40` }}>Get free demo</button>
        </div>
      </div>
    </nav>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 32px 80px rgba(0,0,0,0.25)", overflow: "hidden", width: "100%", maxWidth: 640, border: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ background: "#F8FAFB", borderBottom: "1px solid #E8ECF0", padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57", "#FFBD2E", "#28C840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#94A3B8" }}>dashboard.hospibot.in</div>
      </div>
      <div style={{ padding: 20, background: "#F8FAFB" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Good morning, Dr. Priya</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>Apollo Diagnostics — Hyderabad</div>
          </div>
          <div style={{ padding: "5px 12px", background: "#E8F5F0", borderRadius: 20, fontSize: 11, color: TEAL, fontWeight: 600 }}>Live</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { v: "₹2.4L", l: "Today's revenue", c: "#E8F5F0", tc: TEAL },
            { v: "312", l: "Tests processed", c: "#EEF2FF", tc: "#4F46E5" },
            { v: "48", l: "Reports delivered", c: "#FEF3E2", tc: "#D97706" },
            { v: "98%", l: "WA open rate", c: "#F0FDF4", tc: "#16A34A" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.c, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.tc }}>{s.v}</div>
              <div style={{ fontSize: 9, color: "#64748B", marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #E8ECF0" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: NAVY, marginBottom: 10 }}>Revenue trend (14 days)</div>
            <svg viewBox="0 0 300 80" style={{ width: "100%" }}>
              <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={TEAL} stopOpacity={0.2} /><stop offset="1" stopColor={TEAL} stopOpacity={0} /></linearGradient></defs>
              <path d="M0,60 L22,55 44,48 66,52 88,40 110,35 132,42 154,30 176,25 198,32 220,20 242,15 264,18 286,10" fill="none" stroke={TEAL} strokeWidth="2" />
              <path d="M0,60 L22,55 44,48 66,52 88,40 110,35 132,42 154,30 176,25 198,32 220,20 242,15 264,18 286,10 L286,80 L0,80Z" fill="url(#cg)" />
            </svg>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #E8ECF0" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: NAVY, marginBottom: 8 }}>WhatsApp</div>
            <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: "#16A34A", fontWeight: 600 }}>New booking</div>
              <div style={{ fontSize: 10, color: "#334155" }}>Dr. Sharma — 4:00 PM</div>
            </div>
            <div style={{ background: "#EEF2FF", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: "#4F46E5", fontWeight: 600 }}>Report sent</div>
              <div style={{ fontSize: 10, color: "#334155" }}>Patient #3842 — CBC</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ setPage }: { setPage: (p: string) => void }) {
  return (
    <>
      <section style={{ background: `linear-gradient(165deg, ${NAVY} 0%, #0F2847 50%, #0A3040 100%)`, padding: "140px 40px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 30% 20%, rgba(13,124,102,0.12) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", top: "10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${TEAL}08, transparent)` }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", position: "relative" }}>
          <div>
            <FadeIn>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(13,124,102,0.12)", border: "1px solid rgba(13,124,102,0.25)", borderRadius: 100, padding: "6px 16px 6px 8px", marginBottom: 24 }}>
                <span style={{ background: TEAL, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100 }}>NEW</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Now live in India, UAE & GCC</span>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 style={{ fontSize: 56, fontWeight: 800, color: "#fff", lineHeight: 1.08, letterSpacing: -2, margin: "0 0 24px" }}>
                The <span style={{ color: TEAL }}>WhatsApp-first</span><br />healthcare operating system
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 480 }}>
                Unify patient communication, revenue automation, CRM, and hospital operations — all in one platform. Zero training required.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button onClick={() => setPage("Contact")} style={{ background: `linear-gradient(135deg, ${TEAL}, #14B88C)`, border: "none", color: "#fff", padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: `0 8px 30px ${TEAL}40`, transition: "all 0.3s" }}>
                  Get free demo
                </button>
                <button onClick={() => setPage("Solutions")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "all 0.3s", backdropFilter: "blur(10px)" }}>
                  View all portals
                </button>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div style={{ display: "flex", gap: 48, marginTop: 52 }}>
                <StatPill value="98%" label="WhatsApp open rate" />
                <StatPill value="60%" label="No-show reduction" />
                <StatPill value="<7" label="Days to go live" />
                <StatPill value="9" label="Portal families" />
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.3}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, background: `radial-gradient(circle at center, ${TEAL}15, transparent 70%)`, borderRadius: 30 }} />
              <DashboardMockup />
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: "40px 40px", background: "#fff", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 24, fontWeight: 500, textTransform: "uppercase", letterSpacing: 2 }}>Trusted by healthcare providers across India, UAE & Middle East</p>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 60, flexWrap: "wrap", opacity: 0.35 }}>
            {["Apollo Health", "LifeCare DX", "MedCity Clinics", "CarePlus IVF", "HealthFirst Labs", "Fortis Network"].map(n => (
              <span key={n} style={{ fontSize: 18, fontWeight: 700, color: NAVY, letterSpacing: -0.3 }}>{n}</span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "100px 40px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, textAlign: "center" }}>Core platform</p>
            <h2 style={{ fontSize: 42, fontWeight: 800, color: NAVY, textAlign: "center", letterSpacing: -1, marginBottom: 16 }}>Six pillars. One platform.</h2>
            <p style={{ fontSize: 17, color: "#64748B", textAlign: "center", maxWidth: 580, margin: "0 auto 60px" }}>Everything a modern healthcare provider needs — integrated, automated, and accessible via WhatsApp.</p>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: "💬", title: "WhatsApp-first OS", desc: "Every patient touchpoint flows through WhatsApp — bookings, reports, bills, reminders. 98% open rates. Zero app downloads.", color: "#E8F5F0" },
              { icon: "📈", title: "Recurring revenue engine", desc: "Rule-based automated follow-ups turn one-time patients into recurring revenue. Closed loop: reminder → booking → payment.", color: "#EEF2FF" },
              { icon: "👥", title: "Healthcare CRM", desc: "Full patient lifecycle management. Lead tracking, conversion funnels, segmentation, bulk campaigns — purpose-built for healthcare.", color: "#FEF3E2" },
              { icon: "⚙️", title: "Operations OS", desc: "Departments, scheduling, bed management, GST billing, lab orders, pharmacy — the complete hospital back-office in one screen.", color: "#F5F3FF" },
              { icon: "🏢", title: "Enterprise multi-tenancy", desc: "Isolated data per tenant, RBAC, multi-branch, HIPAA/DPDPA compliance. Chains of 100+ locations run on one platform.", color: "#FFF1F2" },
              { icon: "🤖", title: "AI clinical tools", desc: "Dictate prescriptions in English, Hindi, Telugu, Tamil. Drug interaction alerts, ABHA Health ID, Universal Patient Vault.", color: "#F0FDF4" },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{ background: "#fff", border: "1px solid #E8ECF0", borderRadius: 16, padding: 28, transition: "all 0.3s", cursor: "default", height: "100%" }}
                  onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${TEAL}10`; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = "#E8ECF0"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "100px 40px", background: LIGHT }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, textAlign: "center" }}>Simple setup</p>
            <h2 style={{ fontSize: 42, fontWeight: 800, color: NAVY, textAlign: "center", letterSpacing: -1, marginBottom: 60 }}>Live in 3 simple steps</h2>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, position: "relative" }}>
            <div style={{ position: "absolute", top: 36, left: "16.6%", right: "16.6%", height: 2, background: `linear-gradient(90deg, ${TEAL}30, ${TEAL}, ${TEAL}30)` }} />
            {[
              { n: "01", title: "Onboard & configure", desc: "Sign up, set up departments, add doctors, configure billing. Your dedicated WhatsApp number is provisioned automatically." },
              { n: "02", title: "Connect & go live", desc: "Share your WhatsApp number with patients. The AI chatbot handles bookings, routing, and confirmations from day one." },
              { n: "03", title: "Grow & automate", desc: "Activate pre-built clinical protocols. Automate follow-ups, refill reminders, and campaigns. Watch revenue grow." },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div style={{ textAlign: "center", padding: "0 28px", position: "relative" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: TEAL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, margin: "0 auto 24px", position: "relative", zIndex: 2, boxShadow: `0 8px 24px ${TEAL}30` }}>{s.n}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "100px 40px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, textAlign: "center" }}>Testimonials</p>
            <h2 style={{ fontSize: 42, fontWeight: 800, color: NAVY, textAlign: "center", letterSpacing: -1, marginBottom: 60 }}>What our customers say</h2>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { q: "HospiBot reduced our no-show rate by 62% in the first month. The WhatsApp integration is seamless — patients actually respond.", n: "Dr. Rajesh Kumar", r: "Apollo Diagnostics" },
              { q: "We went from manual billing to automated invoicing in 4 days. Our collections improved by 40% and staff saved 3 hours daily.", n: "Dr. Meera Patel", r: "LifeCare Multi-Specialty" },
              { q: "Managing 12 branches was a nightmare before HospiBot. Now I see real-time analytics across all locations from one dashboard.", n: "Vikram Reddy", r: "HealthFirst Lab Network" },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{ background: "#F8FAFB", border: "1px solid #E8ECF0", borderRadius: 16, padding: 28 }}>
                  <div style={{ fontSize: 12, marginBottom: 14 }}>⭐⭐⭐⭐⭐</div>
                  <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px" }}>&ldquo;{t.q}&rdquo;</p>
                  <div style={{ borderTop: "1px solid #E8ECF0", paddingTop: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{t.n}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>{t.r}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 40px", background: `linear-gradient(135deg, ${NAVY}, #0F2847)` }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <FadeIn>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: -1, marginBottom: 16 }}>Ready to transform your patient experience?</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 36 }}>Join 500+ healthcare providers already using HospiBot. Get started with a free 14-day trial — no credit card required.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
              <button onClick={() => window.location.href = '/register'} style={{ background: `linear-gradient(135deg, ${TEAL}, #14B88C)`, border: "none", color: "#fff", padding: "16px 36px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", boxShadow: `0 8px 30px ${TEAL}40` }}>Start free trial</button>
              <button onClick={() => setPage("Contact")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "16px 32px", borderRadius: 10, fontSize: 16, fontWeight: 500, cursor: "pointer" }}>Talk to sales</button>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}

function FeaturesPage() {
  const features = [
    { cat: "Patient engagement", items: [
      { t: "WhatsApp chatbot", d: "AI-powered bot handles bookings, reminders, report delivery. Supports English, Hindi, Telugu, Tamil." },
      { t: "Appointment scheduling", d: "Online booking via WhatsApp with slot management, doctor calendars, and auto-confirmation." },
      { t: "Report delivery", d: "PDF reports auto-delivered via WhatsApp with download link. 98% open rate vs 15% email." },
      { t: "Patient health vault", d: "Mobile number as portable health ID. Consent-based cross-provider record sharing." },
    ]},
    { cat: "Clinical operations", items: [
      { t: "Lab orders & worklist", d: "Sample barcode tracking, 8-stage order lifecycle, critical value alerts, auto-validation rules." },
      { t: "Result entry & approval", d: "Structured data entry with reference ranges, approval workflows, and audit trails." },
      { t: "Quality control (QC)", d: "Westgard rules, Levey-Jennings charts, EQAS tracking, NABL documentation suite." },
      { t: "Equipment & inventory", d: "Reagent tracking, equipment calibration logs, expiry alerts, reorder automation." },
    ]},
    { cat: "Revenue & billing", items: [
      { t: "GST invoicing", d: "GSTIN, HSN codes, e-invoice generation. Auto-calculate CGST/SGST/IGST." },
      { t: "Razorpay payments", d: "Payment links, subscription billing, wallet recharge. UPI, cards, net banking." },
      { t: "TPA & insurance", d: "Pre-authorization, claims tracking, cashless settlement, TPA rate management." },
      { t: "Revenue engine", d: "Automated follow-ups, refill reminders, package renewals. Turn one-time patients into recurring revenue." },
    ]},
    { cat: "Analytics & compliance", items: [
      { t: "Real-time dashboard", d: "Revenue, TAT, test volume, WhatsApp metrics. Drill-down by branch, doctor, department." },
      { t: "Regulatory compliance", d: "PC-PNDT Form F, AERB dose logs, BMW waste management, NACO reporting. Hard-blocks enforced." },
      { t: "Government reporting", d: "DGHS, ICMR, CDSCO report generation. Auto-fill regulatory forms from clinical data." },
      { t: "NABL accreditation", d: "Document management, SOP library, internal audit tracking, EQAS records." },
    ]},
  ];
  return (
    <section style={{ padding: "140px 40px 80px", background: "#fff" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Product</p>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: NAVY, letterSpacing: -1.5, marginBottom: 16 }}>Every feature your healthcare practice needs</h1>
          <p style={{ fontSize: 18, color: "#64748B", maxWidth: 600, marginBottom: 60 }}>From patient communication to regulatory compliance — built for Indian healthcare regulations and workflows.</p>
        </FadeIn>
        {features.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: 60 }}>
            <FadeIn><h2 style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginBottom: 24, paddingBottom: 12, borderBottom: `2px solid ${LIGHT}` }}>{cat.cat}</h2></FadeIn>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {cat.items.map((f, fi) => (
                <FadeIn key={fi} delay={fi * 0.08}>
                  <div style={{ background: "#F8FAFB", border: "1px solid #E8ECF0", borderRadius: 14, padding: 24, transition: "all 0.2s" }}
                    onMouseEnter={(e: any) => e.currentTarget.style.borderColor = TEAL}
                    onMouseLeave={(e: any) => e.currentTarget.style.borderColor = "#E8ECF0"}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{f.t}</h3>
                    <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65, margin: 0 }}>{f.d}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SolutionsPage({ setPage }: { setPage: (p: string) => void }) {
  const portals = [
    { icon: "🏥", name: "Clinical portal", sub: "75 subtypes", desc: "Solo doctors to 500-bed hospital chains. Specialists, surgeons, AYUSH, rehab, mental health centers.", color: "#E8F5F0" },
    { icon: "🔬", name: "Diagnostic portal", sub: "34 subtypes", desc: "Pathology, radiology, PCR, genetics, ultrasound, PET scan, blood bank, health checkup, home collection.", color: "#EEF2FF" },
    { icon: "💊", name: "Pharmacy portal", sub: "14 subtypes", desc: "Retail chemists, hospital pharmacy, online pharmacy, AYUSH, oncology, cold chain, wholesale.", color: "#FEF3E2" },
    { icon: "🏠", name: "Home care portal", sub: "12 subtypes", desc: "Home nursing, physiotherapy, elder care, ICU at home, ambulance, patient transport.", color: "#F5F3FF" },
    { icon: "🔧", name: "Equipment portal", sub: "10 subtypes", desc: "Medical device suppliers, surgical instruments, imaging equipment, dental, lab consumables.", color: "#FFF1F2" },
    { icon: "🧘", name: "Wellness portal", sub: "11 subtypes", desc: "Fitness, yoga, nutrition, spa, meditation, naturopathy, holistic health centers.", color: "#F0FDF4" },
    { icon: "🛎️", name: "Services portal", sub: "8 subtypes", desc: "Medical tourism, health tech staffing, ambulance, consulting, accreditation services.", color: "#FEF9E7" },
  ];
  return (
    <section style={{ padding: "140px 40px 80px", background: "#fff" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Solutions</p>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: NAVY, letterSpacing: -1.5, marginBottom: 16 }}>One platform. Every type of healthcare provider.</h1>
          <p style={{ fontSize: 18, color: "#64748B", maxWidth: 640, marginBottom: 60 }}>From solo practitioners to 500-bed hospital chains — a dedicated portal for every healthcare entity.</p>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {portals.map((p, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div style={{ background: "#fff", border: "1px solid #E8ECF0", borderRadius: 16, padding: 28, display: "flex", gap: 20, transition: "all 0.3s", cursor: "pointer" }}
                onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 8px 32px ${TEAL}10`; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = "#E8ECF0"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, margin: 0 }}>{p.name}</h3>
                    <span style={{ background: LIGHT, color: TEAL, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 100 }}>{p.sub}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}><div style={{ textAlign: "center", marginTop: 48 }}>
          <button onClick={() => setPage("Pricing")} style={{ background: `linear-gradient(135deg, ${TEAL}, #14B88C)`, border: "none", color: "#fff", padding: "14px 36px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: `0 8px 30px ${TEAL}40` }}>See pricing for your portal</button>
        </div></FadeIn>
      </div>
    </section>
  );
}

function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [portalTab, setPortalTab] = useState("clinical");
  const pricing: Record<string, any[]> = {
    clinical: [
      { name: "Starter", price: annual ? 499 : 599, desc: "Solo doctor or single-room clinic", badge: null, features: ["1 doctor, 1 branch", "50 appointments/day", "WhatsApp report delivery", "Basic billing (GST)", "500 WA messages/mo", "Email support"], cta: "Start free trial" },
      { name: "Growth", price: annual ? 2499 : 2999, desc: "Growing clinic with referrals & insurance", badge: "Most popular", features: ["10 doctors, 3 branches", "300 appointments/day", "WhatsApp chatbot + CRM", "TPA/insurance billing", "5,000 WA messages/mo", "Tally export, doctor CRM", "Priority support"], cta: "Start free trial" },
      { name: "Professional", price: annual ? 6999 : 7999, desc: "Multi-specialty clinic or nursing home", badge: null, features: ["50 doctors, 10 branches", "1,000 appointments/day", "HRMS + staff scheduling", "Advanced analytics", "25,000 WA messages/mo", "NABL docs, QC module", "4hr SLA support"], cta: "Start free trial" },
      { name: "Enterprise", price: null, desc: "Hospital chains & franchises", badge: "Contact sales", features: ["Unlimited doctors & branches", "Unlimited volume", "ABDM/ABHA integration", "API marketplace & SSO", "Custom integrations", "White-label option", "Dedicated account manager"], cta: "Contact sales" },
    ],
    diagnostic: [
      { name: "Starter", price: annual ? 999 : 1199, desc: "Single-room lab or collection center", badge: null, features: ["5 users, 1 branch", "50 tests/day", "Barcode tracking", "PDF report + WhatsApp", "2,000 WA messages/mo", "Email support"], cta: "Start free trial" },
      { name: "Growth", price: annual ? 2999 : 3499, desc: "Growing lab with referrals & TPA", badge: "Most popular", features: ["20 users, 3 branches", "300 tests/day", "Doctor CRM + referrals", "TPA/insurance billing", "10,000 WA messages/mo", "Analyzer interface (HL7)", "Home collection module"], cta: "Start free trial" },
      { name: "Professional", price: annual ? 7999 : 8999, desc: "Multi-site lab with NABL accreditation", badge: null, features: ["75 users, 10 branches", "1,000 tests/day", "QC (Westgard/LJ)", "NABL document suite", "50,000 WA messages/mo", "HRMS + staff mgmt", "Priority 4hr SLA"], cta: "Start free trial" },
      { name: "Enterprise", price: null, desc: "Lab networks & franchise chains", badge: "Contact sales", features: ["Unlimited users & branches", "Unlimited volume", "Hub-spoke routing", "ABDM/ABHA integration", "API marketplace & SSO", "Franchise management", "Dedicated account manager"], cta: "Contact sales" },
    ],
    pharmacy: [
      { name: "Starter", price: annual ? 399 : 499, desc: "Single retail pharmacy", badge: null, features: ["2 users, 1 location", "500 SKUs", "Drug schedule alerts", "GST billing", "1,000 WA messages/mo", "Email support"], cta: "Start free trial" },
      { name: "Growth", price: annual ? 1499 : 1799, desc: "Multi-counter pharmacy with delivery", badge: "Most popular", features: ["10 users, 3 locations", "5,000 SKUs", "Refill reminders", "Inventory auto-reorder", "5,000 WA messages/mo", "Delivery management"], cta: "Start free trial" },
      { name: "Professional", price: annual ? 3999 : 4499, desc: "Hospital pharmacy or chain", badge: null, features: ["50 users, 10 locations", "Unlimited SKUs", "Controlled substance log", "Expiry management", "25,000 WA messages/mo", "Tally export"], cta: "Start free trial" },
      { name: "Enterprise", price: null, desc: "Wholesale or franchise network", badge: "Contact sales", features: ["Unlimited everything", "B2B ordering portal", "Multi-warehouse", "Custom integrations", "API access", "Dedicated AM"], cta: "Contact sales" },
    ],
  };
  const plans = pricing[portalTab] || pricing.clinical;
  return (
    <section style={{ padding: "140px 40px 80px", background: "#F8FAFB" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <FadeIn>
          <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, textAlign: "center" }}>Pricing</p>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: NAVY, letterSpacing: -1.5, marginBottom: 16, textAlign: "center" }}>Pricing tailored to your practice</h1>
          <p style={{ fontSize: 18, color: "#64748B", textAlign: "center", maxWidth: 560, margin: "0 auto 32px" }}>Every healthcare provider is unique. Flexible plans based on your portal type, size, and workflows.</p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
            {([["clinical", "Clinical"], ["diagnostic", "Diagnostic"], ["pharmacy", "Pharmacy"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setPortalTab(k)} style={{ padding: "8px 20px", borderRadius: 8, border: portalTab === k ? `2px solid ${TEAL}` : "1px solid #E0E0E0", background: portalTab === k ? LIGHT : "#fff", color: portalTab === k ? TEAL : "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 100, padding: 4, border: "1px solid #E8ECF0" }}>
              <button onClick={() => setAnnual(false)} style={{ padding: "8px 20px", borderRadius: 100, border: "none", background: !annual ? NAVY : "transparent", color: !annual ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>Monthly</button>
              <button onClick={() => setAnnual(true)} style={{ padding: "8px 20px", borderRadius: 100, border: "none", background: annual ? NAVY : "transparent", color: annual ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>Annual <span style={{ background: "#E8F5F0", color: TEAL, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 100, marginLeft: 6 }}>SAVE 17%</span></button>
            </div>
          </div>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "start" }}>
          {plans.map((p: any, i: number) => {
            const featured = p.badge === "Most popular";
            return (
              <FadeIn key={`${portalTab}-${i}`} delay={i * 0.08}>
                <div style={{ background: "#fff", borderRadius: 20, border: featured ? `2px solid ${TEAL}` : "1px solid #E8ECF0", overflow: "hidden", position: "relative", transform: featured ? "scale(1.04)" : "none", boxShadow: featured ? `0 16px 48px ${TEAL}15` : "0 2px 12px rgba(0,0,0,0.04)", transition: "all 0.3s" }}>
                  {p.badge && <div style={{ background: p.badge === "Most popular" ? TEAL : NAVY, color: "#fff", textAlign: "center", padding: "6px 0", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{p.badge}</div>}
                  <div style={{ padding: "28px 24px" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 4 }}>{p.name}</h3>
                    <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20, minHeight: 36 }}>{p.desc}</p>
                    {p.price ? (
                      <div style={{ marginBottom: 24 }}>
                        <span style={{ fontSize: 40, fontWeight: 800, color: NAVY }}>₹{p.price.toLocaleString("en-IN")}</span>
                        <span style={{ fontSize: 14, color: "#94A3B8" }}>/mo</span>
                        {annual && <div style={{ fontSize: 12, color: TEAL, fontWeight: 600, marginTop: 4 }}>Billed ₹{(p.price * 12).toLocaleString("en-IN")}/year</div>}
                      </div>
                    ) : <div style={{ fontSize: 28, fontWeight: 800, color: NAVY, marginBottom: 24, lineHeight: 1.5 }}>Custom</div>}
                    <button onClick={() => window.location.href = '/register'} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: featured ? "none" : "1px solid #E8ECF0", background: featured ? `linear-gradient(135deg, ${TEAL}, #14B88C)` : "#F8FAFB", color: featured ? "#fff" : NAVY, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", marginBottom: 24 }}>{p.cta}</button>
                    <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 18 }}>
                      {p.features.map((f: string, fi: number) => (
                        <div key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="8" cy="8" r="8" fill={LIGHT} /><path d="M5 8l2 2 4-4" stroke={TEAL} strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                          <span style={{ fontSize: 13, color: "#475569" }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
        <FadeIn delay={0.3}><div style={{ textAlign: "center", marginTop: 40, fontSize: 14, color: "#94A3B8" }}>14-day free trial · No credit card required · HIPAA & DPDPA compliant</div></FadeIn>
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section style={{ padding: "140px 40px 80px", background: "#fff" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <FadeIn>
          <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>About us</p>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: NAVY, letterSpacing: -1.5, marginBottom: 24 }}>Democratizing healthcare technology</h1>
          <p style={{ fontSize: 18, color: "#64748B", lineHeight: 1.8, marginBottom: 60, maxWidth: 700 }}>HospiBot was built with one mission: make enterprise-grade hospital management accessible to every healthcare provider on Earth.</p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ background: `linear-gradient(135deg, ${NAVY}, #0F2847)`, borderRadius: 20, padding: 48, marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Our vision</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 32 }}>The global default operating system for healthcare. Every clinic connected. Every patient engaged. Every rupee accounted for.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[{ v: "9", l: "Portal families" }, { v: "159+", l: "Portal subtypes" }, { v: "4", l: "Languages" }, { v: "3", l: "Countries live" }].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: TEAL }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginBottom: 24 }}>Five problems we solve</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { icon: "📱", t: "Patients ignore calls & SMS", d: "WhatsApp has 98% open rates vs 15% for SMS. Every touchpoint flows through the channel patients actually use." },
              { icon: "💸", t: "Revenue leaks & no-shows", d: "Automated reminders, follow-ups, and rebooking reduce no-shows by 60% and recover lost revenue automatically." },
              { icon: "📊", t: "No visibility across branches", d: "Real-time dashboard shows revenue, TAT, and operations across all locations. One screen, complete visibility." },
              { icon: "📋", t: "Regulatory compliance burden", d: "Built-in PC-PNDT, AERB, NACO, BMW compliance. Hard-blocks prevent violations. Auto-generate government reports." },
            ].map((p, i) => (
              <div key={i} style={{ background: "#F8FAFB", border: "1px solid #E8ECF0", borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{p.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{p.t}</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65, margin: 0 }}>{p.d}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function ContactPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", org: "", type: "", size: "" });
  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8ECF0", fontSize: 14, outline: "none", boxSizing: "border-box" as const, transition: "border 0.2s" };
  return (
    <section style={{ padding: "140px 40px 80px", background: "#F8FAFB" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }}>
        <FadeIn>
          <div>
            <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Get in touch</p>
            <h1 style={{ fontSize: 42, fontWeight: 800, color: NAVY, letterSpacing: -1, marginBottom: 16 }}>Let&apos;s talk healthcare</h1>
            <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 40 }}>Register your portal in 2 minutes. See exact pricing for your portal type and size — no sales call needed.</p>
            {[{ icon: "📧", label: "Email", value: "hello@hospibot.in" }, { icon: "📞", label: "Phone", value: "+91 90000 90000" }, { icon: "📍", label: "Office", value: "Hyderabad, India" }].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>{c.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8ECF0", padding: 36, boxShadow: "0 8px 32px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
              {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: step >= s ? TEAL : "#E8ECF0", transition: "all 0.3s" }} />)}
            </div>
            {step === 1 && <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 20 }}>Your details</h3>
              {[["Full name", "name", "text"], ["Email address", "email", "email"], ["Phone number", "phone", "tel"]].map(([l, k, t]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, color: "#64748B", fontWeight: 500, marginBottom: 6 }}>{l}</label>
                  <input type={t} value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <button onClick={() => setStep(2)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${TEAL}, #14B88C)`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 10 }}>Continue</button>
            </div>}
            {step === 2 && <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 20 }}>About your practice</h3>
              <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 13, color: "#64748B", fontWeight: 500, marginBottom: 6 }}>Organization name</label><input value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} style={inputStyle} /></div>
              <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 13, color: "#64748B", fontWeight: 500, marginBottom: 6 }}>Facility type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, background: "#fff" }}><option value="">Select portal type</option><option>Clinical</option><option>Diagnostic</option><option>Pharmacy</option><option>Home Care</option><option>Equipment</option><option>Wellness</option></select></div>
              <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 13, color: "#64748B", fontWeight: 500, marginBottom: 6 }}>Size</label><select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} style={{ ...inputStyle, background: "#fff" }}><option value="">Select size</option><option>Solo / 1 location</option><option>Small (2-5)</option><option>Medium (5-20)</option><option>Large (20+)</option></select></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #E8ECF0", background: "#fff", color: NAVY, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${TEAL}, #14B88C)`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Submit</button>
              </div>
            </div>}
            {step === 3 && <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28, color: TEAL, fontWeight: 800 }}>✓</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Request submitted!</h3>
              <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>Our team will reach out within 2 hours with personalized pricing and a demo link.</p>
              <button onClick={() => setStep(1)} style={{ padding: "12px 28px", borderRadius: 10, border: "1px solid #E8ECF0", background: "#fff", color: NAVY, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Submit another</button>
            </div>}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function Footer({ setPage }: { setPage: (p: string) => void }) {
  return (
    <footer style={{ background: NAVY, padding: "60px 40px 30px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${TEAL}, #14B88C)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>H</div>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>HospiBot</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 280 }}>WhatsApp-first healthcare operating system. Unifying patient engagement, operations, and revenue for every provider.</p>
          </div>
          {[{ title: "Product", links: ["Features", "Solutions", "Pricing", "Contact"] }, { title: "Portals", links: ["Clinical", "Diagnostic", "Pharmacy", "Home Care"] }, { title: "Company", links: ["About", "Blog", "Careers", "Contact"] }, { title: "Legal", links: ["Privacy Policy", "Terms of Service", "HIPAA", "DPDPA"] }].map((col, i) => (
            <div key={i}>
              <h4 style={{ color: "#fff", fontSize: 13, fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>{col.title}</h4>
              {col.links.map(l => <div key={l} onClick={() => { if (pages.includes(l)) { setPage(l); window.scrollTo({ top: 0, behavior: "smooth" }); } }} style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 10, cursor: "pointer" }}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2026 HospiBot. All rights reserved. Made in Hyderabad, India.</p>
          <div style={{ display: "flex", gap: 8 }}>
            {["HIPAA", "DPDPA", "ISO 27001"].map(b => <span key={b} style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6 }}>{b}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingHome() {
  const [page, setPage] = useState("Home");
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", color: NAVY, overflowX: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Nav page={page} setPage={setPage} />
      {page === "Home" && <HomePage setPage={setPage} />}
      {page === "Features" && <FeaturesPage />}
      {page === "Solutions" && <SolutionsPage setPage={setPage} />}
      {page === "Pricing" && <PricingPage />}
      {page === "About" && <AboutPage />}
      {page === "Contact" && <ContactPage />}
      <Footer setPage={setPage} />
    </div>
  );
}
