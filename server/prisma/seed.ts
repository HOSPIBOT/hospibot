/**
 * HospiBot Database Seed
 * Seeds: 7 Portal Families, 75+ Sub-types, Portal Themes, Platform Assets
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Portal Families ──────────────────────────────────────────────────────────
const PORTAL_FAMILIES = [
  {
    name: 'Clinical',
    slug: 'clinical',
    description: 'Doctors, clinics, hospitals, specialty centers and all direct patient care providers',
    icon: 'Stethoscope',
    sortOrder: 1,
    theme: {
      primaryColor: '#0D7C66', primaryDark: '#0A5E4F', primaryLight: '#E8F5F0',
      accentColor: '#F59E0B', sidebarBg: '#063A31', loginBg: '#0D7C66', loginGradient: '#0A5E4F',
    },
    subTypes: [
      // Group 1 — Individual Practitioners
      { name: 'General Physician / GP', slug: 'general-physician', icon: 'UserRound', sortOrder: 1,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: false } },
      { name: 'Specialist Doctor', slug: 'specialist-doctor', icon: 'Microscope', sortOrder: 2,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: false } },
      { name: 'Surgeon', slug: 'surgeon', icon: 'Scissors', sortOrder: 3,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, otScheduling: true } },
      { name: 'Paediatrician', slug: 'paediatrician', icon: 'Baby', sortOrder: 4,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Gynaecologist / Obstetrician', slug: 'gynaecologist', icon: 'HeartPulse', sortOrder: 5,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Psychiatrist', slug: 'psychiatrist', icon: 'Brain', sortOrder: 6,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, mentalHealth: true } },
      { name: 'Dermatologist / Cosmetologist', slug: 'dermatologist', icon: 'Sparkles', sortOrder: 7,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Oncologist', slug: 'oncologist', icon: 'Ribbon', sortOrder: 8,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Cardiologist', slug: 'cardiologist', icon: 'Heart', sortOrder: 9,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Neurologist', slug: 'neurologist', icon: 'Brain', sortOrder: 10,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Orthopaedic Surgeon', slug: 'orthopaedic-surgeon', icon: 'Bone', sortOrder: 11,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, otScheduling: true } },
      { name: 'Nephrologist / Urologist', slug: 'nephrologist', icon: 'Droplets', sortOrder: 12,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Gastroenterologist', slug: 'gastroenterologist', icon: 'Activity', sortOrder: 13,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Pulmonologist', slug: 'pulmonologist', icon: 'Wind', sortOrder: 14,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Endocrinologist', slug: 'endocrinologist', icon: 'FlaskConical', sortOrder: 15,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Geriatric Specialist', slug: 'geriatric-specialist', icon: 'UserCheck', sortOrder: 16,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      // Group 2 — Facilities
      { name: 'General / Family Medicine Clinic', slug: 'family-clinic', icon: 'Building2', sortOrder: 20,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, branches: true } },
      { name: 'Multi-Specialty Clinic', slug: 'multi-specialty-clinic', icon: 'Building2', sortOrder: 21,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, departments: true, branches: true } },
      { name: 'Polyclinic', slug: 'polyclinic', icon: 'Building2', sortOrder: 22,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, departments: true, branches: true } },
      { name: 'Nursing Home (< 30 beds)', slug: 'nursing-home', icon: 'Hotel', sortOrder: 23,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, beds: true, ipd: true, departments: true } },
      { name: 'Hospital (30–200 beds)', slug: 'hospital-mid', icon: 'Hospital', sortOrder: 24,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, beds: true, ipd: true, departments: true, branches: true, otScheduling: true } },
      { name: 'Hospital (200+ beds)', slug: 'hospital-large', icon: 'Hospital', sortOrder: 25,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, beds: true, ipd: true, departments: true, branches: true, otScheduling: true, tpaInsurance: true } },
      { name: 'Super-Specialty Hospital', slug: 'super-specialty-hospital', icon: 'Hospital', sortOrder: 26,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, beds: true, ipd: true, departments: true, branches: true, otScheduling: true, tpaInsurance: true } },
      { name: 'Charitable / Trust Hospital', slug: 'trust-hospital', icon: 'Heart', sortOrder: 27,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, beds: true, ipd: true, departments: true } },
      // Group 3 — Specialty Centers
      { name: 'IVF / Fertility Center', slug: 'ivf-center', icon: 'Baby', sortOrder: 30,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, ivfCycles: true, embryology: true } },
      { name: 'Maternity Hospital', slug: 'maternity-hospital', icon: 'Baby', sortOrder: 31,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true, beds: true, ipd: true } },
      { name: 'Women\'s Health & Wellness Clinic', slug: 'womens-health', icon: 'HeartPulse', sortOrder: 32,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, doctors: true } },
      { name: 'Dental Clinic / Dental Hospital', slug: 'dental-clinic', icon: 'Smile', sortOrder: 33,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, toothChart: true, dentalXray: true } },
      { name: 'Eye / Ophthalmology Center', slug: 'eye-center', icon: 'Eye', sortOrder: 34,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, visionChart: true, opticalPrescription: true } },
      { name: 'ENT Clinic', slug: 'ent-clinic', icon: 'Ear', sortOrder: 35,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Orthopaedic & Joint Replacement Center', slug: 'orthopaedic-center', icon: 'Bone', sortOrder: 36,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, otScheduling: true } },
      { name: 'Spine Care Center', slug: 'spine-center', icon: 'Activity', sortOrder: 37,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Cardiac / Heart Care Center', slug: 'cardiac-center', icon: 'Heart', sortOrder: 38,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, beds: true } },
      { name: 'Cancer / Oncology Center', slug: 'oncology-center', icon: 'Ribbon', sortOrder: 39,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, beds: true, chemotherapy: true } },
      { name: 'Kidney / Dialysis Center', slug: 'dialysis-center', icon: 'Droplets', sortOrder: 40,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, dialysisSessions: true } },
      { name: 'Bariatric / Weight Loss Center', slug: 'bariatric-center', icon: 'Scale', sortOrder: 41,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Cosmetic & Plastic Surgery Center', slug: 'cosmetic-surgery', icon: 'Sparkles', sortOrder: 42,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, otScheduling: true } },
      { name: 'Hair Transplant Clinic', slug: 'hair-transplant', icon: 'Scissors', sortOrder: 43,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Laser & Aesthetic Clinic', slug: 'laser-aesthetic', icon: 'Zap', sortOrder: 44,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Neurology & Neuro-Surgery Center', slug: 'neurology-center', icon: 'Brain', sortOrder: 45,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true, beds: true, otScheduling: true } },
      // Group 4 — Rehabilitation
      { name: 'Physiotherapy & Rehabilitation Center', slug: 'physiotherapy-center', icon: 'Dumbbell', sortOrder: 50,
        featureFlags: { appointments: true, patients: true, prescriptions: false, billing: true, whatsapp: true, sessionTracking: true, treatmentPlans: true } },
      { name: 'Occupational Therapy Center', slug: 'occupational-therapy', icon: 'Wrench', sortOrder: 51,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, sessionTracking: true } },
      { name: 'Speech & Language Therapy Center', slug: 'speech-therapy', icon: 'MessageCircle', sortOrder: 52,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, sessionTracking: true } },
      { name: 'Hearing Aid & Audiology Center', slug: 'audiology-center', icon: 'Ear', sortOrder: 53,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, products: true } },
      { name: 'Vision Therapy Center', slug: 'vision-therapy', icon: 'Eye', sortOrder: 54,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, sessionTracking: true } },
      { name: 'Neurological Rehabilitation Center', slug: 'neuro-rehab', icon: 'Brain', sortOrder: 55,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, sessionTracking: true, beds: true } },
      { name: 'Sports Medicine & Injury Clinic', slug: 'sports-medicine', icon: 'Trophy', sortOrder: 56,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      { name: 'Pain Management Clinic', slug: 'pain-management', icon: 'Zap', sortOrder: 57,
        featureFlags: { appointments: true, patients: true, prescriptions: true, billing: true, whatsapp: true } },
      // Group 5 — AYUSH / Alternative Medicine
      { name: 'Ayurveda Clinic / Panchakarma Center', slug: 'ayurveda-clinic', icon: 'Leaf', sortOrder: 60,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, ayurvedicPrescriptions: true, panchakarma: true } },
      { name: 'Homeopathy Clinic', slug: 'homeopathy-clinic', icon: 'FlaskConical', sortOrder: 61,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true } },
      { name: 'Unani Clinic', slug: 'unani-clinic', icon: 'Leaf', sortOrder: 62,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true } },
      { name: 'Siddha Clinic', slug: 'siddha-clinic', icon: 'Leaf', sortOrder: 63,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true } },
      { name: 'Naturopathy Center', slug: 'naturopathy-center', icon: 'Flower2', sortOrder: 64,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true } },
      { name: 'Acupuncture / Acupressure Clinic', slug: 'acupuncture-clinic', icon: 'Pin', sortOrder: 65,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true } },
      { name: 'Chiropractic Clinic', slug: 'chiropractic-clinic', icon: 'Activity', sortOrder: 66,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true } },
      { name: 'Traditional Chinese Medicine Clinic', slug: 'tcm-clinic', icon: 'Leaf', sortOrder: 67,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true } },
      // Group 6 — Mental Health
      { name: 'Psychology / Counselling Practice', slug: 'psychology-practice', icon: 'Brain', sortOrder: 70,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, mentalHealth: true, sessionNotes: true } },
      { name: 'De-Addiction & Rehabilitation Center', slug: 'deaddiction-center', icon: 'Shield', sortOrder: 71,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, mentalHealth: true, beds: true } },
      { name: 'Child & Adolescent Mental Health', slug: 'child-mental-health', icon: 'Baby', sortOrder: 72,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, mentalHealth: true } },
      { name: 'Autism Spectrum / Special Needs Center', slug: 'autism-center', icon: 'Puzzle', sortOrder: 73,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, mentalHealth: true, sessionTracking: true } },
      { name: 'Memory & Dementia Care Clinic', slug: 'dementia-clinic', icon: 'Brain', sortOrder: 74,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, mentalHealth: true } },
      // Group 7 — Preventive & Other
      { name: 'Vaccination / Immunization Center', slug: 'vaccination-center', icon: 'Syringe', sortOrder: 80,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, vaccination: true } },
      { name: 'Corporate Health Clinic', slug: 'corporate-health', icon: 'Briefcase', sortOrder: 81,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true } },
      { name: 'Palliative & Hospice Care', slug: 'palliative-care', icon: 'Heart', sortOrder: 82,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, beds: true, homeVisits: true } },
      { name: 'Blood Donation Center', slug: 'blood-donation', icon: 'Droplets', sortOrder: 83,
        featureFlags: { appointments: true, patients: true, billing: false, whatsapp: true } },
      { name: 'Organ Transplant Center', slug: 'organ-transplant', icon: 'Heart', sortOrder: 84,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, beds: true, otScheduling: true } },
      { name: 'Neonatal / NICU Care Center', slug: 'nicu-center', icon: 'Baby', sortOrder: 85,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, beds: true } },
    ],
  },
  {
    name: 'Diagnostic',
    slug: 'diagnostic',
    description: 'Pathology labs, radiology centers, scan centers and all diagnostic service providers',
    icon: 'FlaskConical',
    sortOrder: 2,
    theme: {
      primaryColor: '#1E3A5F', primaryDark: '#152A47', primaryLight: '#EFF6FF',
      accentColor: '#06B6D4', sidebarBg: '#0F1E33', loginBg: '#1E3A5F', loginGradient: '#152A47',
    },
    subTypes: [
      { name: 'Pathology / Blood Test Lab', slug: 'pathology-lab', icon: 'TestTube', sortOrder: 1,
        featureFlags: { labReports: true, billing: true, whatsapp: true, homeCollection: true, reportDelivery: true } },
      { name: 'Radiology Center (X-Ray, CT, MRI)', slug: 'radiology-center', icon: 'ScanLine', sortOrder: 2,
        featureFlags: { labReports: true, scanReports: true, billing: true, whatsapp: true, reportDelivery: true } },
      { name: 'Ultrasound Center', slug: 'ultrasound-center', icon: 'Activity', sortOrder: 3,
        featureFlags: { labReports: true, scanReports: true, billing: true, whatsapp: true, reportDelivery: true } },
      { name: 'PET Scan Center', slug: 'pet-scan-center', icon: 'ScanLine', sortOrder: 4,
        featureFlags: { labReports: true, scanReports: true, billing: true, whatsapp: true, appointments: true } },
      { name: 'Mammography Center', slug: 'mammography-center', icon: 'ScanLine', sortOrder: 5,
        featureFlags: { labReports: true, scanReports: true, billing: true, whatsapp: true, appointments: true } },
      { name: 'Cardiac Diagnostics (Echo, TMT, Holter)', slug: 'cardiac-diagnostics', icon: 'Heart', sortOrder: 6,
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, reportDelivery: true } },
      { name: 'Pulmonary Function Testing Center', slug: 'pft-center', icon: 'Wind', sortOrder: 7,
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true } },
      { name: 'Neurophysiology (EEG, EMG) Center', slug: 'neurophysiology-center', icon: 'Brain', sortOrder: 8,
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true } },
      { name: 'Genetic Testing Lab', slug: 'genetic-lab', icon: 'Dna', sortOrder: 9,
        featureFlags: { labReports: true, billing: true, whatsapp: true, reportDelivery: true } },
      { name: 'Molecular Diagnostics / PCR Lab', slug: 'molecular-lab', icon: 'Microscope', sortOrder: 10,
        featureFlags: { labReports: true, billing: true, whatsapp: true, reportDelivery: true } },
      { name: 'Microbiological Lab', slug: 'micro-lab', icon: 'Microscope', sortOrder: 11,
        featureFlags: { labReports: true, billing: true, whatsapp: true, reportDelivery: true } },
      { name: 'Health Checkup Center', slug: 'health-checkup', icon: 'ClipboardCheck', sortOrder: 12,
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, packages: true } },
      { name: 'Corporate Wellness Screening', slug: 'corporate-screening', icon: 'Briefcase', sortOrder: 13,
        featureFlags: { labReports: true, billing: true, whatsapp: true, packages: true, bulkBooking: true } },
      { name: 'Home Sample Collection Service', slug: 'home-sample-collection', icon: 'Home', sortOrder: 14,
        featureFlags: { labReports: true, billing: true, whatsapp: true, homeCollection: true, gpsTracking: true } },
    ],
  },
  {
    name: 'Pharmacy',
    slug: 'pharmacy',
    description: 'Medical stores, online pharmacies, drug distributors and medicine retailers',
    icon: 'Pill',
    sortOrder: 3,
    theme: {
      primaryColor: '#166534', primaryDark: '#14532D', primaryLight: '#F0FDF4',
      accentColor: '#84CC16', sidebarBg: '#0D3B20', loginBg: '#166534', loginGradient: '#14532D',
    },
    subTypes: [
      { name: 'Retail Medical Store / Chemist', slug: 'retail-pharmacy', icon: 'Store', sortOrder: 1,
        featureFlags: { inventory: true, billing: true, whatsapp: true, prescriptionSales: true, products: true } },
      { name: 'Hospital / Institutional Pharmacy', slug: 'hospital-pharmacy', icon: 'Building2', sortOrder: 2,
        featureFlags: { inventory: true, billing: true, whatsapp: true, prescriptionSales: true, products: true, bulkDispensing: true } },
      { name: 'Online Pharmacy (Home Delivery)', slug: 'online-pharmacy', icon: 'Truck', sortOrder: 3,
        featureFlags: { inventory: true, billing: true, whatsapp: true, prescriptionSales: true, products: true, delivery: true, ecommerce: true } },
      { name: 'Generic Medicine Store (Jan Aushadhi)', slug: 'generic-store', icon: 'Package', sortOrder: 4,
        featureFlags: { inventory: true, billing: true, whatsapp: true, products: true } },
      { name: 'Pharma Distributor', slug: 'pharma-distributor', icon: 'Truck', sortOrder: 5,
        featureFlags: { inventory: true, billing: true, whatsapp: true, products: true, b2bOrders: true, creditManagement: true } },
      { name: 'Medical Distributor', slug: 'medical-distributor', icon: 'Package', sortOrder: 6,
        featureFlags: { inventory: true, billing: true, whatsapp: true, products: true, b2bOrders: true } },
      { name: 'C&F Agent', slug: 'cnf-agent', icon: 'Warehouse', sortOrder: 7,
        featureFlags: { inventory: true, billing: true, whatsapp: true, products: true, b2bOrders: true, warehouseManagement: true } },
      { name: 'Ayurvedic / Herbal Medicine Store', slug: 'ayurvedic-store', icon: 'Leaf', sortOrder: 8,
        featureFlags: { inventory: true, billing: true, whatsapp: true, products: true, ecommerce: true } },
      { name: 'Homeopathy Medicine Store', slug: 'homeopathy-store', icon: 'FlaskConical', sortOrder: 9,
        featureFlags: { inventory: true, billing: true, whatsapp: true, products: true, ecommerce: true } },
      { name: 'Veterinary Pharmacy', slug: 'veterinary-pharmacy', icon: 'PawPrint', sortOrder: 10,
        featureFlags: { inventory: true, billing: true, whatsapp: true, products: true } },
      { name: 'Compounding Pharmacy', slug: 'compounding-pharmacy', icon: 'FlaskConical', sortOrder: 11,
        featureFlags: { inventory: true, billing: true, whatsapp: true, prescriptionSales: true, compounding: true } },
    ],
  },
  {
    name: 'Home Care',
    slug: 'homecare',
    description: 'Home nursing, ambulance services, home sample collection, elder care and patient transport',
    icon: 'Home',
    sortOrder: 4,
    theme: {
      primaryColor: '#6B21A8', primaryDark: '#581C87', primaryLight: '#FAF5FF',
      accentColor: '#FB923C', sidebarBg: '#3B0764', loginBg: '#6B21A8', loginGradient: '#581C87',
    },
    subTypes: [
      { name: 'Home Nursing Services', slug: 'home-nursing', icon: 'Heart', sortOrder: 1,
        featureFlags: { homeVisits: true, billing: true, whatsapp: true, staffDispatch: true, caregiverTracking: true } },
      { name: 'Home Physiotherapy', slug: 'home-physio', icon: 'Dumbbell', sortOrder: 2,
        featureFlags: { homeVisits: true, billing: true, whatsapp: true, staffDispatch: true, sessionTracking: true } },
      { name: 'Home Doctor Visit', slug: 'home-doctor', icon: 'Stethoscope', sortOrder: 3,
        featureFlags: { homeVisits: true, appointments: true, billing: true, whatsapp: true, doctors: true } },
      { name: 'Home Palliative Care', slug: 'home-palliative', icon: 'Heart', sortOrder: 4,
        featureFlags: { homeVisits: true, billing: true, whatsapp: true, staffDispatch: true, carePlans: true } },
      { name: 'Post-Surgery Home Care', slug: 'post-surgery-care', icon: 'BandageIcon', sortOrder: 5,
        featureFlags: { homeVisits: true, billing: true, whatsapp: true, staffDispatch: true, carePlans: true } },
      { name: 'Mother & Baby Home Care', slug: 'mother-baby-care', icon: 'Baby', sortOrder: 6,
        featureFlags: { homeVisits: true, billing: true, whatsapp: true, staffDispatch: true } },
      { name: 'Elder Care / Caregiver Services', slug: 'elder-care', icon: 'UserCheck', sortOrder: 7,
        featureFlags: { homeVisits: true, billing: true, whatsapp: true, staffDispatch: true, caregiverTracking: true, subscriptionPlans: true } },
      { name: 'Ambulance Service (Emergency)', slug: 'ambulance-emergency', icon: 'Siren', sortOrder: 8,
        featureFlags: { billing: true, whatsapp: true, ambulanceDispatch: true, gpsTracking: true, fleetManagement: true } },
      { name: 'Patient Transport (Non-Emergency)', slug: 'patient-transport', icon: 'Car', sortOrder: 9,
        featureFlags: { billing: true, whatsapp: true, ambulanceDispatch: true, gpsTracking: true, appointments: true } },
      { name: 'Air Ambulance', slug: 'air-ambulance', icon: 'Plane', sortOrder: 10,
        featureFlags: { billing: true, whatsapp: true, ambulanceDispatch: true, fleetManagement: true } },
      { name: 'Home Medical Equipment Rental', slug: 'equipment-rental', icon: 'Package', sortOrder: 11,
        featureFlags: { billing: true, whatsapp: true, inventory: true, products: true, rentalManagement: true } },
    ],
  },
  {
    name: 'Equipment',
    slug: 'equipment',
    description: 'Medical equipment suppliers, surgical instruments, orthotics, mobility aids and consumables',
    icon: 'Wrench',
    sortOrder: 5,
    theme: {
      primaryColor: '#1E40AF', primaryDark: '#1E3A8A', primaryLight: '#EFF6FF',
      accentColor: '#94A3B8', sidebarBg: '#0F172A', loginBg: '#1E40AF', loginGradient: '#1E3A8A',
    },
    subTypes: [
      { name: 'Medical Equipment Supplier', slug: 'medical-equipment', icon: 'Monitor', sortOrder: 1,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, b2bOrders: true, ecommerce: true, amc: true } },
      { name: 'Hospital Furniture Supplier', slug: 'hospital-furniture', icon: 'Package', sortOrder: 2,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, b2bOrders: true, ecommerce: true } },
      { name: 'Surgical Instruments Dealer', slug: 'surgical-instruments', icon: 'Scissors', sortOrder: 3,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, b2bOrders: true } },
      { name: 'Orthotics & Prosthetics Supplier', slug: 'orthotics-prosthetics', icon: 'Bone', sortOrder: 4,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, customOrders: true } },
      { name: 'Medical Disposables / PPE Supplier', slug: 'disposables-ppe', icon: 'Shield', sortOrder: 5,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, b2bOrders: true, bulkOrders: true } },
      { name: 'Diagnostic Equipment Supplier', slug: 'diagnostic-equipment', icon: 'FlaskConical', sortOrder: 6,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, amc: true } },
      { name: 'Rehabilitation Equipment Supplier', slug: 'rehab-equipment', icon: 'Dumbbell', sortOrder: 7,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, rentalManagement: true } },
      { name: 'Medical Gases Supplier (Oxygen, N2O)', slug: 'medical-gases', icon: 'Wind', sortOrder: 8,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, cylinderTracking: true } },
      { name: 'Mobility Aids Supplier', slug: 'mobility-aids', icon: 'Accessibility', sortOrder: 9,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, ecommerce: true } },
      { name: 'Patient Monitoring Equipment', slug: 'monitoring-equipment', icon: 'Activity', sortOrder: 10,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, amc: true } },
      { name: 'Imaging Equipment Supplier (MRI, CT, X-Ray)', slug: 'imaging-equipment', icon: 'ScanLine', sortOrder: 11,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, amc: true } },
      { name: 'Dental Equipment Supplier', slug: 'dental-equipment', icon: 'Smile', sortOrder: 12,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, amc: true } },
      { name: 'Optical Equipment Supplier', slug: 'optical-equipment', icon: 'Eye', sortOrder: 13,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true } },
    ],
  },
  {
    name: 'Wellness',
    slug: 'wellness',
    description: 'Fitness centers, nutrition clinics, yoga studios, supplement stores and holistic health providers',
    icon: 'Heart',
    sortOrder: 6,
    theme: {
      primaryColor: '#E11D48', primaryDark: '#BE123C', primaryLight: '#FFF1F2',
      accentColor: '#EAB308', sidebarBg: '#881337', loginBg: '#E11D48', loginGradient: '#BE123C',
    },
    subTypes: [
      { name: 'Fitness Center / Gym', slug: 'gym', icon: 'Dumbbell', sortOrder: 1,
        featureFlags: { appointments: true, billing: true, whatsapp: true, memberships: true, classScheduling: true } },
      { name: 'Yoga Studio', slug: 'yoga-studio', icon: 'Flower2', sortOrder: 2,
        featureFlags: { appointments: true, billing: true, whatsapp: true, memberships: true, classScheduling: true } },
      { name: 'Meditation Center', slug: 'meditation-center', icon: 'Sunrise', sortOrder: 3,
        featureFlags: { appointments: true, billing: true, whatsapp: true, memberships: true, classScheduling: true } },
      { name: 'Nutrition / Diet Counselling', slug: 'nutrition-clinic', icon: 'Salad', sortOrder: 4,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, mealPlans: true } },
      { name: 'Supplement & Nutraceutical Store', slug: 'supplement-store', icon: 'Package', sortOrder: 5,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, ecommerce: true } },
      { name: 'Weight Management Center', slug: 'weight-management', icon: 'Scale', sortOrder: 6,
        featureFlags: { appointments: true, patients: true, billing: true, whatsapp: true, mealPlans: true } },
      { name: 'Health Food Store', slug: 'health-food-store', icon: 'ShoppingBag', sortOrder: 7,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, ecommerce: true } },
      { name: 'Spa & Holistic Wellness Center', slug: 'spa-wellness', icon: 'Sparkles', sortOrder: 8,
        featureFlags: { appointments: true, billing: true, whatsapp: true, memberships: true } },
      { name: 'Optical Store / Spectacle Shop', slug: 'optical-store', icon: 'Glasses', sortOrder: 9,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, ecommerce: true, opticalPrescription: true } },
      { name: 'Hearing Aid Store', slug: 'hearing-aid-store', icon: 'Ear', sortOrder: 10,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, appointments: true } },
      { name: 'AYUSH Product Seller', slug: 'ayush-products', icon: 'Leaf', sortOrder: 11,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, ecommerce: true } },
      { name: 'Aromatherapy / Essential Oils', slug: 'aromatherapy', icon: 'Droplets', sortOrder: 12,
        featureFlags: { products: true, inventory: true, billing: true, whatsapp: true, ecommerce: true } },
    ],
  },
  {
    name: 'Services',
    slug: 'services',
    description: 'Healthcare staffing, facility management, billing agencies, medical tourism and support services',
    icon: 'Briefcase',
    sortOrder: 7,
    theme: {
      primaryColor: '#334155', primaryDark: '#1E293B', primaryLight: '#F8FAFC',
      accentColor: '#14B8A6', sidebarBg: '#0F172A', loginBg: '#334155', loginGradient: '#1E293B',
    },
    subTypes: [
      { name: 'Medical Staffing Agency', slug: 'medical-staffing', icon: 'Users', sortOrder: 1,
        featureFlags: { billing: true, whatsapp: true, staffManagement: true, contracts: true } },
      { name: 'Hospital Facility Management', slug: 'facility-management', icon: 'Building2', sortOrder: 2,
        featureFlags: { billing: true, whatsapp: true, contracts: true, serviceTickets: true } },
      { name: 'Bio-Medical Waste Management', slug: 'biowaste-management', icon: 'Trash2', sortOrder: 3,
        featureFlags: { billing: true, whatsapp: true, contracts: true, scheduleManagement: true } },
      { name: 'Medical Laundry Service', slug: 'medical-laundry', icon: 'Shirt', sortOrder: 4,
        featureFlags: { billing: true, whatsapp: true, contracts: true, scheduleManagement: true } },
      { name: 'CSSD / Sterilization Service', slug: 'cssd-sterilization', icon: 'Thermometer', sortOrder: 5,
        featureFlags: { billing: true, whatsapp: true, contracts: true } },
      { name: 'Medical Billing / RCM Agency', slug: 'medical-billing-rcm', icon: 'Receipt', sortOrder: 6,
        featureFlags: { billing: true, whatsapp: true, contracts: true, tpaInsurance: true } },
      { name: 'Health Insurance TPA', slug: 'health-insurance-tpa', icon: 'Shield', sortOrder: 7,
        featureFlags: { billing: true, whatsapp: true, tpaInsurance: true, claimsManagement: true } },
      { name: 'Medical Tourism Facilitator', slug: 'medical-tourism', icon: 'Plane', sortOrder: 8,
        featureFlags: { appointments: true, billing: true, whatsapp: true, patientCoordination: true, visaAssistance: true } },
      { name: 'Health Camp & Screening Organizer', slug: 'health-camp', icon: 'Tent', sortOrder: 9,
        featureFlags: { billing: true, whatsapp: true, eventManagement: true, bulkRegistration: true } },
      { name: 'Telemedicine Aggregator', slug: 'telemedicine-aggregator', icon: 'Video', sortOrder: 10,
        featureFlags: { appointments: true, billing: true, whatsapp: true, teleconsult: true, doctors: true } },
      { name: 'Medical Coding Agency', slug: 'medical-coding', icon: 'Code', sortOrder: 11,
        featureFlags: { billing: true, whatsapp: true, contracts: true } },
      { name: 'Hospital Accreditation Consultant', slug: 'accreditation-consultant', icon: 'Award', sortOrder: 12,
        featureFlags: { billing: true, whatsapp: true, contracts: true, documentManagement: true } },
      { name: 'Medical Training & CME Institute', slug: 'medical-training', icon: 'GraduationCap', sortOrder: 13,
        featureFlags: { appointments: true, billing: true, whatsapp: true, courseManagement: true, certificates: true } },
      { name: 'Ambulance Fleet Management', slug: 'ambulance-fleet', icon: 'Truck', sortOrder: 14,
        featureFlags: { billing: true, whatsapp: true, fleetManagement: true, gpsTracking: true, contracts: true } },
    ],
  },
];

async function main() {
  console.log('🌱 Starting HospiBot database seed...');

  // ── Platform Assets (logo, tagline) ──────────────────────────────────────
  await prisma.platformAsset.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      logoUrl: '/hospibot-logo.png',
      logoAlt: 'HospiBot',
      tagline: 'Connect 24*7...',
    },
    update: {},
  });
  console.log('✅ Platform assets seeded');

  // ── Portal Families + Sub-types + Themes ──────────────────────────────────
  for (const family of PORTAL_FAMILIES) {
    const { theme, subTypes, ...familyData } = family;

    // Upsert portal family
    const pf = await prisma.portalFamily.upsert({
      where: { slug: familyData.slug },
      create: familyData,
      update: { name: familyData.name, description: familyData.description, icon: familyData.icon, sortOrder: familyData.sortOrder },
    });

    // Upsert theme
    await prisma.portalTheme.upsert({
      where: { portalFamilyId: pf.id },
      create: { portalFamilyId: pf.id, ...theme },
      update: {},
    });

    // Upsert sub-types
    for (const st of subTypes) {
      await prisma.tenantSubType.upsert({
        where: { portalFamilyId_slug: { portalFamilyId: pf.id, slug: st.slug } },
        create: { ...st, portalFamilyId: pf.id },
        update: { name: st.name, icon: st.icon, sortOrder: st.sortOrder },
      });
    }

    console.log(`✅ ${familyData.name} portal: ${subTypes.length} sub-types seeded`);
  }

  // ── Platform Config ────────────────────────────────────────────────────────
  await prisma.platformConfig.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      settings: {
        trialDays: 14,
        autoSuspendAfterDays: 3,
        allowNewRegistrations: true,
        requireEmailVerification: false,
        maintenanceMode: false,
        supportEmail: 'support@hospibot.in',
        alertEmailRecipients: 'ops@hospibot.in',
      },
    },
    update: {},
  });
  console.log('✅ Platform config seeded');

  const totalSubTypes = PORTAL_FAMILIES.reduce((sum, f) => sum + f.subTypes.length, 0);
  console.log(`\n🎉 Seed complete! 7 portal families, ${totalSubTypes} sub-types seeded.`);
}

// ── Auto-migrate existing tenants to portalFamilyId ─────────────────────────
async function migrateExistingTenants() {
  const TYPE_TO_PORTAL: Record<string, string> = {
    HOSPITAL: 'clinical',    CLINIC: 'clinical',
    DOCTOR: 'clinical',      IVF_CENTER: 'clinical',
    DIAGNOSTIC_CENTER: 'diagnostic',
    PHARMACY: 'pharmacy',    HOME_HEALTHCARE: 'homecare',
    EQUIPMENT_VENDOR: 'equipment',
  };

  const families = await prisma.portalFamily.findMany({ select: { id: true, slug: true } });
  const slugToId = Object.fromEntries(families.map(f => [f.slug, f.id]));

  const tenantsToMigrate = await prisma.tenant.findMany({
    where: { portalFamilyId: null },
    select: { id: true, type: true },
  });

  let migrated = 0;
  for (const t of tenantsToMigrate) {
    const portalSlug = TYPE_TO_PORTAL[t.type as string] ?? 'clinical';
    const portalFamilyId = slugToId[portalSlug];
    if (portalFamilyId) {
      await prisma.tenant.update({
        where: { id: t.id },
        data: { portalFamilyId },
      });
      migrated++;
    }
  }
  if (migrated > 0) console.log(`✅ Migrated ${migrated} existing tenants to portal families`);
  else console.log('ℹ️  No existing tenants needed migration');
}

async function runAll() {
  await main();
  await migrateExistingTenants();
  await seedWATemplates();
}

runAll()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

// ── WhatsApp Templates seed ─────────────────────────────────────────────────
const WA_TEMPLATES = [
  { name: 'appointment_confirmation', displayName: 'Appointment Confirmation', category: 'APPOINTMENT',
    bodyText: 'Your appointment with Dr. {{doctor_name}} at {{facility_name}} is confirmed for {{date}} at {{time}}. Your token number is {{token}}. Reply RESCHEDULE to change the time.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Reschedule' }, { type: 'QUICK_REPLY', text: 'Cancel' }],
    variables: ['doctor_name', 'facility_name', 'date', 'time', 'token'] },
  { name: 'appointment_reminder_24h', displayName: 'Appointment Reminder (24 Hours)', category: 'APPOINTMENT',
    bodyText: 'Reminder: You have an appointment tomorrow, {{date}} at {{time}} with Dr. {{doctor_name}} at {{facility_name}}.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Confirm' }, { type: 'QUICK_REPLY', text: 'Reschedule' }],
    variables: ['date', 'time', 'doctor_name', 'facility_name'] },
  { name: 'appointment_reminder_2h', displayName: 'Appointment Reminder (2 Hours)', category: 'APPOINTMENT',
    bodyText: 'Your appointment with Dr. {{doctor_name}} is in 2 hours at {{time}}. Please arrive 10 minutes early. Token: {{token}}.',
    buttons: [], variables: ['doctor_name', 'time', 'token'] },
  { name: 'lab_report_ready', displayName: 'Lab Report Ready', category: 'LAB',
    bodyText: 'Your {{test_name}} report from {{facility_name}} is ready.',
    buttons: [{ type: 'URL', text: 'Download Report', url: '{{report_url}}' }],
    variables: ['test_name', 'facility_name', 'report_url'] },
  { name: 'payment_request', displayName: 'Payment Request', category: 'BILLING',
    bodyText: 'Your invoice from {{facility_name}} for ₹{{amount}} (Invoice: {{invoice_number}}) is ready. Tap below to pay securely.',
    buttons: [{ type: 'URL', text: 'Pay Now', url: '{{payment_url}}' }],
    variables: ['facility_name', 'amount', 'invoice_number', 'payment_url'] },
  { name: 'payment_receipt', displayName: 'Payment Receipt', category: 'BILLING',
    bodyText: 'Payment received! ₹{{amount}} paid to {{facility_name}}. Invoice: {{invoice_number}}. Thank you.',
    buttons: [], variables: ['amount', 'facility_name', 'invoice_number'] },
  { name: 'followup_reminder', displayName: 'Follow-Up Reminder', category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, Dr. {{doctor_name}} at {{facility_name}} recommends a follow-up. It has been {{days}} days since your last visit.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Book Now' }, { type: 'QUICK_REPLY', text: 'Remind Later' }, { type: 'QUICK_REPLY', text: 'Not Needed' }],
    variables: ['name', 'doctor_name', 'facility_name', 'days'] },
  { name: 'medicine_refill_reminder', displayName: 'Medicine Refill Reminder', category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, your prescription for {{medicine_name}} from {{facility_name}} is due for refill in {{days}} days.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Request Refill' }, { type: 'QUICK_REPLY', text: 'I Have Enough' }],
    variables: ['name', 'medicine_name', 'facility_name', 'days'] },
  { name: 'lab_test_reminder', displayName: 'Lab Test Reminder', category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, Dr. {{doctor_name}} recommends your {{test_name}} test. It has been {{period}} since your last test.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Book Test' }, { type: 'QUICK_REPLY', text: 'Remind Later' }],
    variables: ['name', 'doctor_name', 'test_name', 'period'] },
  { name: 'chronic_care_check', displayName: 'Chronic Care Check-In', category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, checking in on your {{condition}} management. How are you feeling today?',
    buttons: [{ type: 'QUICK_REPLY', text: 'Doing Well' }, { type: 'QUICK_REPLY', text: 'Need Appointment' }, { type: 'QUICK_REPLY', text: 'Call Me' }],
    variables: ['name', 'condition'] },
  { name: 'discharge_followup', displayName: 'Post-Discharge Follow-Up', category: 'FOLLOWUP',
    bodyText: 'Hi {{name}}, you were discharged from {{facility_name}} {{days}} days ago. Hope you are recovering well.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Book Follow-up' }, { type: 'QUICK_REPLY', text: 'I Am Fine' }],
    variables: ['name', 'facility_name', 'days'] },
];

async function seedWATemplates() {
  for (const tmpl of WA_TEMPLATES) {
    await prisma.whatsappTemplate.upsert({
      where: { name_tenantId: { name: tmpl.name, tenantId: null } },
      create: { ...tmpl, tenantId: null, isDefault: true, status: 'APPROVED' } as any,
      update: { status: 'APPROVED' },
    });
  }
  console.log(`✅ ${WA_TEMPLATES.length} WhatsApp templates seeded`);
}
