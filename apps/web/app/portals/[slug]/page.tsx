import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

/* ── PORTAL DATA ─────────────────────────────────────────────────────────── */
const PORTALS: Record<string, {
  name: string; tagline: string; desc: string; emoji: string;
  color: string; dark: string; light: string;
  stats: { value: string; label: string }[];
  features: { icon: string; title: string; desc: string }[];
  benefits: { icon: string; title: string; desc: string }[];
  usecases: { title: string; desc: string }[];
  workflow: { step: string; title: string; desc: string }[];
}> = {
  clinical: {
    name: 'Clinical Portal', tagline: 'The complete operating system for Indian healthcare providers',
    desc: 'From solo doctors to 500-bed hospital chains — HospiBot\'s Clinical Portal gives you a WhatsApp-first healthcare OS that manages appointments, patients, billing, EMR, and communication in one unified platform.',
    emoji: '🩺', color: '#0D7C66', dark: '#065F46', light: '#ECFDF5',
    stats: [
      {value:'60%', label:'Reduction in no-shows'},
      {value:'98%', label:'WhatsApp open rate'},
      {value:'3×', label:'Faster billing cycles'},
      {value:'<7 days', label:'Go-live time'},
    ],
    features: [
      {icon:'💬', title:'WhatsApp-First Appointments', desc:'Patients book, confirm, and reschedule via WhatsApp. AI chatbot handles 80% of queries without staff involvement. Automated reminders sent 24h and 2h before every appointment.'},
      {icon:'📋', title:'Electronic Medical Records (EMR)', desc:'Structured EMR with voice dictation, prescription writing, drug interaction alerts, and ABHA health ID integration. Pre-built templates for 86+ specialties.'},
      {icon:'🏥', title:'OPD & IPD Management', desc:'Complete outpatient and inpatient workflow — token management, bed allocation, ward rounds, discharge summaries, and real-time floor maps.'},
      {icon:'💰', title:'GST Billing & TPA Claims', desc:'GST-compliant invoicing, Razorpay/UPI payment links delivered via WhatsApp, TPA insurance claim processing, and real-time financial dashboards.'},
      {icon:'🔄', title:'Recurring Revenue Engine', desc:'Automated protocol-based follow-ups, vaccination reminders, chronic disease monitoring, and reactivation campaigns. Turn one-time visits into lifetime patients.'},
      {icon:'📊', title:'CRM & Lead Management', desc:'Capture leads from WhatsApp, website, and referrals. Visual pipeline, campaign management, and analytics. Know exactly where every patient came from.'},
      {icon:'🤖', title:'AI Chatbot Receptionist', desc:'24/7 AI handles FAQs, appointment booking, department routing, and payment queries. Escalates to human staff only when needed.'},
      {icon:'📱', title:'Patient Health Vault', desc:'Universal patient health ID using mobile number. Patients access their complete health history across all HospiBot-connected providers.'},
    ],
    benefits: [
      {icon:'⏱️', title:'Save 3+ hours daily', desc:'Automate reminders, follow-ups, and routine patient communication. Your staff focuses on care, not admin.'},
      {icon:'💸', title:'Increase revenue by 25–40%', desc:'Reduce no-shows by 60%, increase repeat visits through automation, and collect payments faster via WhatsApp links.'},
      {icon:'⭐', title:'5× better patient experience', desc:'Patients love WhatsApp. 98% open rate vs 20% for SMS. Response rates increase 5× compared to traditional channels.'},
      {icon:'📈', title:'Full visibility into your practice', desc:'Real-time dashboards show appointments, revenue, patient satisfaction, and staff performance in one place.'},
    ],
    usecases: [
      {title:'Solo Doctors & GPs', desc:'Manage appointments, prescriptions, and follow-ups single-handedly. WhatsApp automation handles patient communication while you focus on consultations.'},
      {title:'Multi-Specialty Clinics', desc:'Centralised scheduling across all specialties, shared patient records, and department-level analytics.'},
      {title:'Hospitals (30–500+ beds)', desc:'Full IPD management, bed tracking, OT scheduling, lab integration, pharmacy, and multi-department billing.'},
      {title:'IVF & Fertility Centers', desc:'Protocol-specific cycle tracking, hormone therapy reminders, and sensitive communication workflows.'},
    ],
    workflow: [
      {step:'01', title:'Patient books via WhatsApp', desc:'Patient sends a message → AI chatbot shows available slots → patient selects → confirmation sent with QR code token'},
      {step:'02', title:'Doctor sees structured EMR', desc:'Patient arrives, doctor opens their complete history, dictates notes, prescribes with drug interaction checking'},
      {step:'03', title:'Billing & payment in 60 seconds', desc:'Invoice generated, GST calculated, UPI payment link sent via WhatsApp. Payment confirmed instantly.'},
      {step:'04', title:'Automated follow-up kicks in', desc:'Discharge summary sent, next appointment scheduled, medication reminders set — all on WhatsApp, automatically'},
    ],
  },
  diagnostic: {
    name: 'Diagnostic Portal', tagline: 'WhatsApp-first lab management for pathology, radiology and imaging centers',
    desc: 'Complete lab operating system for pathology labs, diagnostic centers, radiology units, and home collection services. Automate sample tracking, report delivery, billing, and patient communication — all on WhatsApp.',
    emoji: '🔬', color: '#1E3A5F', dark: '#152A47', light: '#EFF6FF',
    stats: [
      {value:'80%', label:'Reports delivered on WhatsApp'},
      {value:'4×', label:'Faster report turnaround'},
      {value:'35%', label:'More home collections'},
      {value:'NABL', label:'Compliant workflows'},
    ],
    features: [
      {icon:'💉', title:'Sample Collection & Tracking', desc:'8-stage sample lifecycle tracking from collection to result. Barcode scanning, cold chain monitoring, and real-time status updates to patients on WhatsApp.'},
      {icon:'🧪', title:'Lab Order Management', desc:'Test catalog with 3,000+ tests, batch processing, critical value alerts, reference range flagging, and pathologist sign-off workflow.'},
      {icon:'📄', title:'PDF Report Generation', desc:'Professional NABL-format reports with letterhead, QR code verification, and automatic WhatsApp delivery when reports are ready.'},
      {icon:'🏠', title:'Home Collection Management', desc:'Online booking for home sample collection, agent assignment, GPS tracking, cold chain compliance, and collection confirmation.'},
      {icon:'💊', title:'Billing & TPA Integration', desc:'Test-wise pricing, package billing, GST-compliant invoicing, and direct TPA/insurance claim submission with status tracking.'},
      {icon:'📊', title:'Quality Control (QC)', desc:'Westgard rules, Levey-Jennings charts, reagent management, and NABL compliance documentation — built in.'},
      {icon:'🏢', title:'Corporate & Wellness Screening', desc:'Bulk corporate orders, customised health checkup packages, group report generation, and employer dashboards.'},
      {icon:'🔗', title:'Doctor CRM & Referrals', desc:'Track doctor referrals, commission management, performance analytics, and automated test update notifications to referring doctors.'},
    ],
    benefits: [
      {icon:'⚡', title:'Reports delivered instantly', desc:'WhatsApp report delivery means patients get results the moment they\'re ready — no phone calls, no waiting at the counter.'},
      {icon:'🏃', title:'Double your home collection capacity', desc:'Optimised routing, mobile agent app, and online booking fill your home collection slots automatically.'},
      {icon:'🔒', title:'NABL-ready from day one', desc:'Pre-built QC workflows, audit trails, and document management designed for NABL accreditation.'},
      {icon:'💰', title:'Reduce billing errors by 90%', desc:'Test catalog-driven billing eliminates manual entry errors. GST calculations are automatic.'},
    ],
    usecases: [
      {title:'Standalone Pathology Labs', desc:'Complete sample lifecycle, report generation, and WhatsApp delivery for high-volume pathology labs.'},
      {title:'Radiology & Imaging Centers', desc:'Scan scheduling, DICOM viewer integration, radiologist sign-off, and automated result notifications.'},
      {title:'Sample Collection Centers (PSC/PUP)', desc:'Centralized order management, barcode tracking, and seamless integration with parent lab.'},
      {title:'Home Collection Services', desc:'Mobile app for field agents, GPS tracking, route optimization, and real-time cold chain monitoring.'},
    ],
    workflow: [
      {step:'01', title:'Order placed via WhatsApp or walk-in', desc:'Patient books online or walks in → barcode generated → sample collected with cold chain compliance tracked'},
      {step:'02', title:'Lab processes and enters results', desc:'Analyser interface auto-imports results → reference ranges checked → abnormals flagged → pathologist reviews'},
      {step:'03', title:'Report generated & delivered', desc:'Professional PDF report generated → sent to patient on WhatsApp with QR verification → referring doctor notified'},
      {step:'04', title:'Follow-up & revenue engine', desc:'Repeat test reminders, health checkup packages, annual screening campaigns — all automated'},
    ],
  },
  pharmacy: {
    name: 'Pharmacy Portal', tagline: 'Smart pharmacy management for retail, hospital, and online pharmacies',
    desc: 'Modern pharmacy management for retail chemists, hospital pharmacies, online delivery, and wholesale distributors. Prescription management, inventory control, GST billing, and WhatsApp patient communication in one platform.',
    emoji: '💊', color: '#15803D', dark: '#14532D', light: '#F0FDF4',
    stats: [
      {value:'70%', label:'Reduction in stockouts'},
      {value:'45%', label:'Faster prescription filling'},
      {value:'3×', label:'More repeat customers'},
      {value:'100%', label:'GST compliant'},
    ],
    features: [
      {icon:'📝', title:'Prescription Management', desc:'Digital prescription scanning, drug name auto-complete, dosage validation, and patient medication history. Substitution alerts for generic alternatives.'},
      {icon:'📦', title:'Inventory & Expiry Tracking', desc:'Real-time stock levels, auto-reorder triggers, expiry date alerts, batch tracking, and FIFO dispensing to minimise wastage.'},
      {icon:'💊', title:'Drug Interaction Checking', desc:'Built-in drug interaction database alerts pharmacists to dangerous combinations before dispensing. CDSS-powered safety layer.'},
      {icon:'🚗', title:'Home Delivery Management', desc:'Online prescription upload, delivery scheduling, rider tracking, and WhatsApp delivery confirmations. Increase revenue through delivery orders.'},
      {icon:'💰', title:'GST Billing & Accounting', desc:'HSN code-mapped billing, GST-compliant invoices, e-way bill generation, and direct integration with accounting software.'},
      {icon:'🔄', title:'Refill Automation', desc:'Automatic refill reminders via WhatsApp for chronic medication patients. One-tap reorder links. Increase repeat business by 3×.'},
      {icon:'🏪', title:'Multi-Store Management', desc:'Centralised inventory across branches, inter-store stock transfers, consolidated reporting, and franchise management.'},
      {icon:'🤝', title:'Supplier & Purchase Management', desc:'Digital purchase orders, supplier performance tracking, credit management, and automatic reorder based on consumption analytics.'},
    ],
    benefits: [
      {icon:'💸', title:'Increase revenue by 40%', desc:'Delivery orders, refill automation, and loyalty programs generate significant incremental revenue without extra staff.'},
      {icon:'📉', title:'Reduce wastage by 60%', desc:'Expiry tracking and intelligent reordering eliminate costly write-offs from expired stock.'},
      {icon:'⭐', title:'Build patient loyalty', desc:'WhatsApp refill reminders keep patients coming back. Average customer LTV increases 3× with automation.'},
      {icon:'✅', title:'Always GST compliant', desc:'Automated HSN mapping, GSTR-1 data export, and e-invoice generation keep you audit-ready.'},
    ],
    usecases: [
      {title:'Retail Chemists', desc:'Complete POS, inventory, prescription management, and WhatsApp patient communication.'},
      {title:'Hospital Pharmacies', desc:'Integration with HMS, ward indents, patient-linked dispensing, and controlled substance tracking.'},
      {title:'Online Pharmacies', desc:'E-commerce integration, delivery management, and subscription refill workflows.'},
      {title:'Pharma Wholesale / Distributors', desc:'B2B order management, credit limits, route management, and GST e-invoicing.'},
    ],
    workflow: [
      {step:'01', title:'Prescription received', desc:'Patient presents prescription (physical or digital) → system scans and auto-fills drug details → checks for interactions'},
      {step:'02', title:'Dispensing & billing', desc:'Stock deducted in real-time → GST invoice generated → UPI payment link sent via WhatsApp → receipt auto-delivered'},
      {step:'03', title:'Inventory managed automatically', desc:'Stock levels updated → reorder triggered when below threshold → PO sent to supplier automatically'},
      {step:'04', title:'Refill reminder sent', desc:'30 days before medication runs out → WhatsApp reminder with one-tap reorder → patient re-engages without any effort'},
    ],
  },
  homecare: {
    name: 'Home Care Portal', tagline: 'Coordinate home healthcare services from booking to billing',
    desc: 'Complete operations platform for home nursing, physiotherapy, elder care, ambulance services, and ICU-at-home providers. Manage bookings, field agents, patient monitoring, and billing — all in one place.',
    emoji: '🏠', color: '#B45309', dark: '#92400E', light: '#FFFBEB',
    stats: [
      {value:'3×', label:'More bookings per agent'},
      {value:'40%', label:'Reduction in coordination time'},
      {value:'95%', label:'Patient satisfaction score'},
      {value:'Real-time', label:'GPS tracking for agents'},
    ],
    features: [
      {icon:'📅', title:'Booking & Scheduling', desc:'Online appointment booking, service catalog with packages, slot management, and automated confirmation on WhatsApp. Patients book care from home.'},
      {icon:'🗺️', title:'Field Agent Management', desc:'Agent profiles, skill matching, GPS-based assignment, route optimization, and real-time location tracking for families.'},
      {icon:'📊', title:'Patient Monitoring & Notes', desc:'Digital visit notes, vital signs recording, care plan adherence, photo documentation, and daily progress reports to families.'},
      {icon:'🚑', title:'Emergency & Ambulance', desc:'One-tap emergency dispatch, real-time ambulance tracking, hospital pre-notification, and automated family alerts via WhatsApp.'},
      {icon:'💰', title:'Visit-Based Billing', desc:'Per-visit and package billing, GST invoicing, insurance/TPA claims for home care, and UPI payment links on WhatsApp.'},
      {icon:'👨‍👩‍👧', title:'Family Communication', desc:'Daily updates to family WhatsApp groups, agent visit confirmation photos, and immediate alerts for any concerns.'},
      {icon:'📋', title:'Care Plan Management', desc:'Doctor-prescribed care plan execution, medication reminders, physiotherapy exercise guides, and protocol adherence tracking.'},
      {icon:'🏥', title:'Hospital Discharge Integration', desc:'Accept referrals directly from hospital discharge planners, continuity of care documentation, and re-admission prevention protocols.'},
    ],
    benefits: [
      {icon:'🎯', title:'3× more bookings per agent', desc:'Intelligent scheduling eliminates double-booking and maximizes each agent\'s daily capacity with optimized routing.'},
      {icon:'👨‍👩‍👧', title:'Peace of mind for families', desc:'Real-time GPS tracking, photo documentation, and WhatsApp updates keep families informed throughout the care visit.'},
      {icon:'💰', title:'50% faster billing', desc:'Automated visit completion → instant invoice → WhatsApp payment link. No more chasing families for payment.'},
      {icon:'🔒', title:'Audit-ready documentation', desc:'Every visit documented with time-stamps, photos, vitals, and notes — essential for insurance claims and regulatory compliance.'},
    ],
    usecases: [
      {title:'Home Nursing Services', desc:'Post-surgery care, wound dressing, medication administration, and IV therapy at home.'},
      {title:'Home Physiotherapy', desc:'Post-orthopaedic rehab, neurological physiotherapy, and sports injury recovery at home.'},
      {title:'Elder Care', desc:'Daily assistance, companionship, medication management, and fall prevention for seniors.'},
      {title:'ICU at Home', desc:'Critical care equipment, ventilator support, and round-the-clock monitoring for complex patients.'},
    ],
    workflow: [
      {step:'01', title:'Patient or hospital books service', desc:'Online booking or discharge referral → service type selected → best-match agent assigned → confirmation sent on WhatsApp'},
      {step:'02', title:'Agent arrives & checks in', desc:'GPS check-in → care plan reviewed → vitals recorded → family notified with real-time update'},
      {step:'03', title:'Visit completed & documented', desc:'Notes entered → photos uploaded → medication administered → next visit scheduled → family update sent'},
      {step:'04', title:'Billing & follow-up', desc:'Visit summary generated → invoice sent on WhatsApp → payment collected → progress report to referring doctor'},
    ],
  },
  equipment: {
    name: 'Equipment Portal', tagline: 'Smart operations for medical equipment suppliers and distributors',
    desc: 'Complete business platform for medical device suppliers, surgical instrument distributors, imaging equipment providers, and consumables dealers. Manage orders, service contracts, AMC, and customer relationships from one portal.',
    emoji: '⚙️', color: '#6D28D9', dark: '#5B21B6', light: '#F5F3FF',
    stats: [
      {value:'50%', label:'Faster order processing'},
      {value:'90%', label:'AMC renewal rate'},
      {value:'3×', label:'More service requests handled'},
      {value:'Zero', label:'Missed service schedules'},
    ],
    features: [
      {icon:'📦', title:'Order & Inventory Management', desc:'Complete order lifecycle from inquiry to delivery, real-time stock levels across warehouses, serialized tracking for high-value equipment.'},
      {icon:'🔧', title:'Service & AMC Management', desc:'Annual maintenance contracts, preventive maintenance schedules, breakdown service requests, engineer assignment, and spare part tracking.'},
      {icon:'💰', title:'Quote & Invoice Management', desc:'Professional quotations with equipment specs, GST-compliant invoices, EMI calculation for hospital clients, and TDS management.'},
      {icon:'📊', title:'Customer & Equipment Database', desc:'Complete asset register for each customer, equipment installation history, service records, and warranty tracking.'},
      {icon:'🚚', title:'Delivery & Installation', desc:'Delivery scheduling, installation team management, customer training records, and handover documentation.'},
      {icon:'📱', title:'WhatsApp for Sales', desc:'Automated quote follow-ups, service reminder alerts, product catalog on WhatsApp, and instant customer support.'},
      {icon:'🏪', title:'Distributor Management', desc:'Multi-level distribution, territory management, credit limits, scheme management, and distributor performance analytics.'},
      {icon:'🔔', title:'Warranty & Recall Management', desc:'Warranty expiry alerts, automated renewal reminders, product recall management, and certificate generation.'},
    ],
    benefits: [
      {icon:'⚡', title:'Never miss a service schedule', desc:'Automated AMC reminders and PM scheduling eliminate revenue loss from missed maintenance visits.'},
      {icon:'💸', title:'Increase AMC renewal to 90%+', desc:'Automated renewal reminders 90, 60, and 30 days before expiry. One-click renewal via WhatsApp link.'},
      {icon:'📈', title:'3× more leads per salesperson', desc:'WhatsApp-first sales process, automated follow-ups, and pipeline tracking multiply salesperson productivity.'},
      {icon:'🔒', title:'Full compliance documentation', desc:'Service reports, calibration certificates, and quality documentation always ready for hospital audits.'},
    ],
    usecases: [
      {title:'Medical Device Suppliers', desc:'Manage equipment sales, installation, warranty, and after-sales service for hospitals and clinics.'},
      {title:'Surgical Instrument Distributors', desc:'Catalog management, sterilization tracking, and hospital supply chain management.'},
      {title:'Imaging Equipment (X-Ray, MRI, CT)', desc:'Capital equipment sales, installation, AMC, and specialist engineer dispatch management.'},
      {title:'Consumables Distributors', desc:'High-volume consumable supply to hospital networks with automated reorder management.'},
    ],
    workflow: [
      {step:'01', title:'Lead enquires via WhatsApp', desc:'Hospital enquires about equipment → product catalog shared → quote generated → follow-up automated'},
      {step:'02', title:'Order confirmed & scheduled', desc:'PO received → delivery date set → installation team scheduled → customer notified with tracking link'},
      {step:'03', title:'Installation & training', desc:'Equipment installed → training completed → handover certificate signed → warranty registered'},
      {step:'04', title:'AMC & ongoing support', desc:'Preventive maintenance reminders sent → breakdown requests managed → renewal automated before expiry'},
    ],
  },
  wellness: {
    name: 'Wellness Portal', tagline: 'Grow your wellness business with WhatsApp-first member management',
    desc: 'Complete management platform for gyms, yoga studios, nutrition clinics, spas, and holistic health centers. Member management, class scheduling, payments, and automated retention — all in one place.',
    emoji: '💆', color: '#BE185D', dark: '#9D174D', light: '#FFF1F2',
    stats: [
      {value:'60%', label:'Higher member retention'},
      {value:'3×', label:'More class bookings'},
      {value:'45%', label:'Increase in referrals'},
      {value:'Automated', label:'Renewal follow-ups'},
    ],
    features: [
      {icon:'🧘', title:'Class & Session Scheduling', desc:'Online class booking via WhatsApp, capacity management, waitlist management, trainer assignment, and attendance tracking.'},
      {icon:'👥', title:'Member Management', desc:'Complete member profiles, fitness goals, progress tracking, body composition history, and personalized communication.'},
      {icon:'💰', title:'Membership & Package Billing', desc:'Flexible membership plans, session packages, auto-renewal billing, and payment links via WhatsApp.'},
      {icon:'📱', title:'WhatsApp Engagement', desc:'Class reminders, workout tips, nutrition advice, birthday greetings, and re-engagement campaigns for inactive members.'},
      {icon:'📊', title:'Member Analytics', desc:'Attendance patterns, revenue per member, class popularity, trainer performance, and churn prediction.'},
      {icon:'🎯', title:'Retention Automation', desc:'Automated check-ins for absent members, milestone celebrations, achievement badges, and renewal reminders before expiry.'},
      {icon:'🥗', title:'Nutrition & Wellness Plans', desc:'Meal plans, supplement recommendations, and wellness program management with progress tracking.'},
      {icon:'📣', title:'Referral & Loyalty Programs', desc:'Automated referral tracking, reward management, loyalty points, and social proof collection via WhatsApp.'},
    ],
    benefits: [
      {icon:'🔄', title:'60% higher retention', desc:'Automated re-engagement campaigns bring back inactive members before they churn. Save 40% more renewals.'},
      {icon:'📈', title:'Grow without extra staff', desc:'WhatsApp automation handles booking, reminders, and follow-ups. Your team focuses on delivering great classes.'},
      {icon:'💰', title:'Increase revenue per member', desc:'Upsell packages, nutrition plans, and personal training sessions through targeted WhatsApp campaigns.'},
      {icon:'⭐', title:'Build a community', desc:'Member achievements shared on WhatsApp groups, peer motivation, and community events increase lifetime value.'},
    ],
    usecases: [
      {title:'Fitness Centers & Gyms', desc:'Member management, class scheduling, personal training, and automated renewal for gyms of all sizes.'},
      {title:'Yoga Studios', desc:'Class series booking, teacher management, workshop scheduling, and spiritual community building.'},
      {title:'Nutrition & Dietetics Clinics', desc:'Consultation scheduling, meal plan delivery, and long-term patient adherence tracking.'},
      {title:'Spa & Wellness Centers', desc:'Therapist scheduling, treatment packages, retail product management, and luxury client experience.'},
    ],
    workflow: [
      {step:'01', title:'Member books a class via WhatsApp', desc:'Member messages → available classes shown → spot booked → confirmation with timing and trainer sent'},
      {step:'02', title:'Class reminder & check-in', desc:'Reminder 2 hours before class → QR code check-in at door → attendance recorded automatically'},
      {step:'03', title:'Post-session engagement', desc:'Workout summary shared → next session suggested → feedback requested → progress updated'},
      {step:'04', title:'Renewal automation', desc:'Membership expiry approaching → reminder sent 30/15/7 days before → renewal link on WhatsApp → re-engaged'},
    ],
  },
  services: {
    name: 'Services Portal', tagline: 'Operations platform for healthcare support service providers',
    desc: 'Purpose-built portal for healthcare staffing agencies, billing companies, TPA administrators, medical tourism facilitators, and IT implementation partners. Manage clients, contracts, billings, and teams efficiently.',
    emoji: '🤝', color: '#0369A1', dark: '#0C4A6E', light: '#F0F9FF',
    stats: [
      {value:'5×', label:'More client capacity'},
      {value:'80%', label:'Faster invoice processing'},
      {value:'95%', label:'Contract renewal rate'},
      {value:'360°', label:'Client visibility'},
    ],
    features: [
      {icon:'👥', title:'Staff Placement Management', desc:'Healthcare professional database, client requirement matching, interview scheduling, offer management, and placement tracking.'},
      {icon:'🧾', title:'Billing & Revenue Cycle', desc:'Multi-client billing, TPA claim management, denial management, payment tracking, and revenue analytics.'},
      {icon:'📋', title:'Contract Management', desc:'Contract templates, digital signing, renewal tracking, SLA monitoring, and compliance documentation.'},
      {icon:'✈️', title:'Medical Tourism', desc:'International patient coordination, hospital empanelment, visa assistance workflows, cost estimation, and patient journey tracking.'},
      {icon:'📊', title:'Client Dashboard', desc:'Real-time performance dashboards for each client account, SLA adherence, billing status, and relationship health scores.'},
      {icon:'💬', title:'WhatsApp Client Communication', desc:'Automated update reports, placement confirmations, invoice notifications, and escalation management via WhatsApp.'},
      {icon:'🏕️', title:'Health Camp Management', desc:'Camp logistics, team deployment, screening data collection, report generation, and follow-up patient routing.'},
      {icon:'⚙️', title:'IT Project Management', desc:'HMS implementation tracking, milestone management, training scheduling, and go-live support coordination.'},
    ],
    benefits: [
      {icon:'🎯', title:'5× more clients per team', desc:'Automated workflows handle routine communication, leaving your team free to focus on high-value relationship work.'},
      {icon:'💰', title:'80% faster billing cycles', desc:'Automated invoice generation, digital approval workflows, and direct TPA submission reduce billing time drastically.'},
      {icon:'📊', title:'Full client account visibility', desc:'360° view of every client account — contracts, billings, performance, and relationship health — in one dashboard.'},
      {icon:'🔒', title:'Compliance & audit ready', desc:'All contracts, communications, and transactions logged with timestamps. Audit trails always complete.'},
    ],
    usecases: [
      {title:'Healthcare Staffing Agencies', desc:'Manage nurse, doctor, and paramedic placements for hospitals and clinics at scale.'},
      {title:'Medical Billing Companies', desc:'Multi-hospital billing, TPA claim processing, and revenue cycle management.'},
      {title:'TPA & Insurance Administrators', desc:'Claim processing, pre-authorization, policy management, and hospital network management.'},
      {title:'Medical Tourism Facilitators', desc:'International patient coordination, hospital bookings, logistics, and post-treatment follow-up.'},
    ],
    workflow: [
      {step:'01', title:'Client requirement received', desc:'New requirement enters pipeline → skill matching runs → suitable candidates shortlisted → client notified on WhatsApp'},
      {step:'02', title:'Coordination & placement', desc:'Interview scheduled → offer made → placement confirmed → onboarding documentation managed digitally'},
      {step:'03', title:'Invoice & payment', desc:'Services delivered → invoice auto-generated → sent to client → TPA/billing submitted → payment tracked'},
      {step:'04', title:'Account health & renewal', desc:'Monthly performance reports → renewal alerts 60 days before → relationship check-ins automated → NPS collected'},
    ],
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = PORTALS[params.slug];
  if (!p) return {};
  return {
    title: `${p.name} — HospiBot Healthcare OS`,
    description: p.desc.slice(0, 160),
  };
}

export default function PortalDetailPage({ params }: { params: { slug: string } }) {
  const p = PORTALS[params.slug];
  if (!p) notFound();

  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", background:'#F8FAFC', minHeight:'100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ background:p.dark, padding:'80px clamp(20px,5vw,80px) 72px', position:'relative', overflow:'hidden', minHeight:480 }}>
        {/* Mesh gradient base */}
        <div style={{ position:'absolute',inset:0, background:`linear-gradient(135deg,${p.dark} 0%,${p.color}ee 45%,${p.color}88 100%)`, pointerEvents:'none' }}/>
        {/* Large glow orb — top right */}
        <div style={{ position:'absolute',top:'-15%',right:'-8%',width:500,height:500,borderRadius:'50%',background:`radial-gradient(circle,${p.color}60 0%,${p.color}20 40%,transparent 70%)`,filter:'blur(40px)',pointerEvents:'none' }}/>
        {/* Medium glow orb — bottom left */}
        <div style={{ position:'absolute',bottom:'-10%',left:'-5%',width:380,height:380,borderRadius:'50%',background:`radial-gradient(circle,${p.dark}ff 0%,${p.color}40 50%,transparent 70%)`,filter:'blur(50px)',pointerEvents:'none' }}/>
        {/* Small accent orb — center right */}
        <div style={{ position:'absolute',top:'30%',right:'15%',width:220,height:220,borderRadius:'50%',background:`radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%)`,filter:'blur(20px)',pointerEvents:'none' }}/>
        {/* Grid pattern overlay */}
        <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`,backgroundSize:'48px 48px',pointerEvents:'none' }}/>
        {/* Decorative rings */}
        <div style={{ position:'absolute',top:'10%',right:'8%',width:300,height:300,borderRadius:'50%',border:`1px solid rgba(255,255,255,0.06)`,pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:'5%',right:'3%',width:440,height:440,borderRadius:'50%',border:`1px solid rgba(255,255,255,0.04)`,pointerEvents:'none' }}/>
        {/* Diagonal accent band */}
        <div style={{ position:'absolute',top:0,right:0,width:'45%',height:'100%',background:`linear-gradient(to bottom left,rgba(255,255,255,0.04),transparent)`,pointerEvents:'none' }}/>
        {/* Noise texture */}
        <div style={{ position:'absolute',inset:0,opacity:0.04,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")',pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:99, padding:'5px 14px', fontSize:12.5, fontWeight:600, color:'rgba(255,255,255,0.85)', marginBottom:24, letterSpacing:'0.04em' }}>
            {p.emoji} HOSPIBOT {p.name.toUpperCase()}
          </div>
          <h1 style={{ fontSize:'clamp(28px,4.5vw,54px)', fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:18, letterSpacing:'-0.02em', maxWidth:800 }}>
            {p.tagline}
          </h1>
          <p style={{ fontSize:'clamp(15px,1.5vw,18px)', color:'rgba(255,255,255,0.75)', lineHeight:1.75, maxWidth:640, marginBottom:36 }}>
            {p.desc}
          </p>
          {/* CTAs */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:56 }}>
            <Link href={`/register?portal=${params.slug}`} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 28px', borderRadius:12, background:'#fff', color:p.color, fontWeight:800, fontSize:15, textDecoration:'none', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', transition:'transform 0.2s' }}>
              Register Free — 14 Days Trial
            </Link>
            <Link href={`/${params.slug}/login`} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 28px', borderRadius:12, background:'rgba(255,255,255,0.12)', color:'#fff', fontWeight:700, fontSize:15, textDecoration:'none', border:'1.5px solid rgba(255,255,255,0.3)' }}>
              Login to Portal →
            </Link>
            <Link href="/contact" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 28px', borderRadius:12, background:'transparent', color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:15, textDecoration:'none', border:'1.5px solid rgba(255,255,255,0.2)' }}>
              📅 Book a Demo
            </Link>
          </div>
          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
            {p.stats.map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.1)', borderRadius:16, padding:'20px 18px', border:'1px solid rgba(255,255,255,0.15)', backdropFilter:'blur(8px)' }}>
                <div style={{ fontSize:'clamp(22px,3vw,34px)', fontWeight:900, color:'#fff', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', marginTop:6, fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section style={{ padding:'80px clamp(20px,5vw,80px)', background:'#fff', position:'relative', overflow:'hidden' }}>
        {/* Subtle dot grid */}
        <div style={{ position:'absolute',inset:0,backgroundImage:`radial-gradient(${p.color}18 1.5px,transparent 1.5px)`,backgroundSize:'28px 28px',pointerEvents:'none' }}/>
        {/* Corner accent */}
        <div style={{ position:'absolute',top:0,right:0,width:300,height:300,background:`radial-gradient(circle at top right,${p.light},transparent 70%)`,pointerEvents:'none' }}/>
        <div style={{ position:'absolute',bottom:0,left:0,width:250,height:250,background:`radial-gradient(circle at bottom left,${p.light},transparent 70%)`,pointerEvents:'none' }}/>
        <div style={{ textAlign:'center', marginBottom:56, position:'relative' }}>
          <div style={{ display:'inline-block', background:p.light, color:p.color, fontSize:12, fontWeight:700, padding:'4px 14px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Everything you need</div>
          <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:800, color:'#0F172A', marginBottom:12, letterSpacing:'-0.02em' }}>Built for how you actually work</h2>
          <p style={{ fontSize:16, color:'#64748B', maxWidth:560, margin:'0 auto', lineHeight:1.7 }}>
            Every feature in the {p.name} is designed specifically for {params.slug === 'clinical' ? 'healthcare providers' : params.slug + ' professionals'} — not repurposed generic software.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:20 }}>
          {p.features.map(f => (
            <div key={f.title} style={{ background:'#fff', borderRadius:18, padding:'24px 22px', border:'1px solid #E8EDF5', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', transition:'all 0.2s' }}>
              <div style={{ width:46, height:46, borderRadius:13, background:p.light, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:14 }}>{f.icon}</div>
              <h3 style={{ fontSize:15.5, fontWeight:700, color:'#0F172A', marginBottom:8, lineHeight:1.35 }}>{f.title}</h3>
              <p style={{ fontSize:13.5, color:'#64748B', lineHeight:1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ background:'#0A0F1E', padding:'80px clamp(20px,5vw,80px)', position:'relative', overflow:'hidden' }}>
        {/* Colored glow behind section */}
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:700,height:500,borderRadius:'50%',background:`radial-gradient(ellipse,${p.color}30 0%,${p.color}10 40%,transparent 70%)`,filter:'blur(60px)',pointerEvents:'none' }}/>
        {/* Grid */}
        <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,backgroundSize:'56px 56px',pointerEvents:'none' }}/>
        {/* Corner glows */}
        <div style={{ position:'absolute',top:0,left:0,width:200,height:200,background:`radial-gradient(circle,${p.color}20,transparent 70%)`,filter:'blur(30px)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',bottom:0,right:0,width:250,height:250,background:`radial-gradient(circle,${p.color}15,transparent 70%)`,filter:'blur(40px)',pointerEvents:'none' }}/>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div style={{ display:'inline-block', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:12, fontWeight:700, padding:'4px 14px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>How it works</div>
            <h2 style={{ fontSize:'clamp(22px,3vw,36px)', fontWeight:800, color:'#fff', marginBottom:10, letterSpacing:'-0.02em' }}>From sign-up to patient care — in 4 steps</h2>
            <p style={{ fontSize:15.5, color:'rgba(255,255,255,0.7)', maxWidth:520, margin:'0 auto' }}>Go live in under 7 days. No complex implementation. No IT team needed.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20 }}>
            {p.workflow.map((w, i) => (
              <div key={w.step} style={{ background:'rgba(255,255,255,0.1)', borderRadius:18, padding:'24px 20px', border:'1px solid rgba(255,255,255,0.15)', backdropFilter:'blur(8px)' }}>
                <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', marginBottom:10 }}>STEP {w.step}</div>
                <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:12 }}>
                  {['💬','⚡','💰','🔄'][i]}
                </div>
                <h4 style={{ fontSize:14.5, fontWeight:700, color:'#fff', marginBottom:8, lineHeight:1.35 }}>{w.title}</h4>
                <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section style={{ padding:'80px clamp(20px,5vw,80px)', background:'#F8FAFC', position:'relative', overflow:'hidden' }}>
        {/* Subtle diagonal stripes */}
        <div style={{ position:'absolute',inset:0,backgroundImage:`repeating-linear-gradient(135deg,transparent,transparent 40px,${p.color}06 40px,${p.color}06 41px)`,pointerEvents:'none' }}/>
        {/* Side glow */}
        <div style={{ position:'absolute',right:0,top:'20%',width:400,height:400,background:`radial-gradient(circle,${p.light} 0%,transparent 70%)`,pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100, margin:'0 auto', position:'relative' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
          <div>
            <div style={{ display:'inline-block', background:p.light, color:p.color, fontSize:12, fontWeight:700, padding:'4px 14px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16 }}>Why choose HospiBot</div>
            <h2 style={{ fontSize:'clamp(22px,2.8vw,36px)', fontWeight:800, color:'#0F172A', marginBottom:14, letterSpacing:'-0.02em', lineHeight:1.25 }}>
              Real results from day one
            </h2>
            <p style={{ fontSize:15.5, color:'#64748B', lineHeight:1.75, marginBottom:28 }}>
              HospiBot is not just software — it&apos;s an operating system that transforms how you run your practice, engage patients, and grow revenue.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {p.benefits.map(b => (
                <div key={b.title} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:p.light, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, flexShrink:0 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontSize:14.5, fontWeight:700, color:'#0F172A', marginBottom:3 }}>{b.title}</div>
                    <div style={{ fontSize:13.5, color:'#64748B', lineHeight:1.6 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Right side: use cases */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:p.color, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Best suited for</div>
            {p.usecases.map(u => (
              <div key={u.title} style={{ background:'#fff', borderRadius:16, padding:'18px 20px', border:`1.5px solid ${p.light}`, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize:14.5, fontWeight:700, color:'#0F172A', marginBottom:5 }}>{u.title}</div>
                <div style={{ fontSize:13.5, color:'#64748B', lineHeight:1.55 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

        </div>
      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{ background:'#0F172A', padding:'72px clamp(20px,5vw,80px)', position:'relative', overflow:'hidden' }}>
        {/* Large portal-colored glow */}
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:800,height:400,background:`radial-gradient(ellipse,${p.color}35 0%,${p.color}10 50%,transparent 70%)`,filter:'blur(50px)',pointerEvents:'none' }}/>
        {/* Subtle rings */}
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:600,borderRadius:'50%',border:`1px solid ${p.color}20`,pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:900,height:900,borderRadius:'50%',border:`1px solid ${p.color}10`,pointerEvents:'none' }}/>
        {/* Grid */}
        <div style={{ position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)`,backgroundSize:'50px 50px',pointerEvents:'none' }}/>
        <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:16 }}>{p.emoji}</div>
          <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:800, color:'#fff', marginBottom:12, letterSpacing:'-0.02em' }}>
            Ready to transform your {params.slug} practice?
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.75, marginBottom:36 }}>
            Join thousands of healthcare providers already using HospiBot. Start your 14-day free trial — no credit card required.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center' }}>
            <Link href={`/register?portal=${params.slug}`} style={{ display:'inline-flex', alignItems:'center', padding:'15px 32px', borderRadius:13, background:`linear-gradient(135deg,${p.color},${p.dark})`, color:'#fff', fontWeight:800, fontSize:15.5, textDecoration:'none', boxShadow:`0 8px 32px ${p.color}44` }}>
              Start Free Trial →
            </Link>
            <Link href={`/${params.slug}/login`} style={{ display:'inline-flex', alignItems:'center', padding:'15px 28px', borderRadius:13, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.8)', fontWeight:600, fontSize:15, textDecoration:'none', border:'1px solid rgba(255,255,255,0.12)' }}>
              Already registered? Login
            </Link>
            <Link href="/contact" style={{ display:'inline-flex', alignItems:'center', padding:'15px 28px', borderRadius:13, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:15, textDecoration:'none', border:'1px solid rgba(255,255,255,0.12)' }}>
              Book a Demo
            </Link>
          </div>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', marginTop:20 }}>14-day free trial · No credit card · HIPAA & DPDPA compliant · Go live in 7 days</p>
        </div>
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(PORTALS).map(slug => ({ slug }));
}
