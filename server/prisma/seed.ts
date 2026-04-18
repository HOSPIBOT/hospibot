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
      // ── Group A: Collection & Logistics (3) ─────────────────────────────────
      { name: 'Sample Collection Center (PSC)', slug: 'sample-collection-center', icon: 'Droplet', sortOrder: 10,
        groupSlug: 'collection',
        subtypeTagline: 'Walk-in collection center that dispatches samples to a parent lab for processing.',
        volumeHint: '30–500 samples/day',
        featureFlags: { billing: true, whatsapp: true, collection: true, dispatch: true, barcoding: true } },
      { name: 'Pickup Point (PUP)', slug: 'pickup-point', icon: 'MapPin', sortOrder: 11,
        groupSlug: 'collection',
        subtypeTagline: 'Counter inside a pharmacy or clinic where patients hand over samples.',
        volumeHint: '5–50 samples/day',
        featureFlags: { billing: true, whatsapp: true, collection: true, lightweight: true } },
      { name: 'Home Sample Collection Service', slug: 'home-sample-collection', icon: 'Home', sortOrder: 12,
        groupSlug: 'collection',
        subtypeTagline: 'Phlebotomist teams visit patient homes at booked time slots with cold-chain transport.',
        volumeHint: '10–500 bookings/day',
        featureFlags: { billing: true, whatsapp: true, homeCollection: true, gpsTracking: true, scheduling: true } },

      // ── Group B: Pathology & Lab Testing (6) ────────────────────────────────
      { name: 'Clinical Pathology Lab', slug: 'pathology-lab', icon: 'TestTube', sortOrder: 20,
        groupSlug: 'pathology',
        subtypeTagline: 'Biochemistry, haematology, serology — CBC, LFT, KFT, thyroid, lipid, HbA1c.',
        volumeHint: '20–1000+ patients/day',
        featureFlags: { labReports: true, billing: true, whatsapp: true, homeCollection: true, reportDelivery: true, accession: true } },
      { name: 'Histopathology & Cytopathology Lab', slug: 'histopathology-lab', icon: 'Microscope', sortOrder: 21,
        groupSlug: 'pathology',
        subtypeTagline: 'Tissue biopsies, IHC, FNAC, Pap smears, frozen sections for oncology.',
        volumeHint: '5–200 specimens/day',
        featureFlags: { labReports: true, billing: true, whatsapp: true, slideScanning: true, ihc: true, reportDelivery: true } },
      { name: 'Molecular Diagnostics / PCR Lab', slug: 'molecular-lab', icon: 'Dna', sortOrder: 22,
        groupSlug: 'pathology',
        subtypeTagline: 'RT-PCR, viral load quantification, HPV genotyping, NGS panels.',
        volumeHint: '20–500 samples/day',
        featureFlags: { labReports: true, billing: true, whatsapp: true, reportDelivery: true, bsl2: true, batchRuns: true } },
      { name: 'Microbiological Laboratory', slug: 'micro-lab', icon: 'Bug', sortOrder: 23,
        groupSlug: 'pathology',
        subtypeTagline: 'Culture, sensitivity, antibiogram, AMR reporting.',
        volumeHint: '10–400 cultures/day',
        featureFlags: { labReports: true, billing: true, whatsapp: true, culture: true, antibiogram: true, bsl2: true } },
      { name: 'Clinical Genetic Testing Laboratory', slug: 'genetic-lab', icon: 'Sparkles', sortOrder: 24,
        groupSlug: 'pathology',
        subtypeTagline: 'Karyotype, BRCA, NIPT, newborn screen, ACMG variant reporting with counselling.',
        volumeHint: '2–200 tests/day',
        featureFlags: { labReports: true, billing: true, whatsapp: true, reportDelivery: true, counselling: true, variantReporting: true } },
      { name: 'Blood Bank & Transfusion Center', slug: 'blood-bank', icon: 'Droplets', sortOrder: 25,
        groupSlug: 'pathology',
        subtypeTagline: 'Blood collection, component separation, cross-match, transfusion dispatch.',
        volumeHint: '10–500 units/day',
        featureFlags: { billing: true, whatsapp: true, donorRegistry: true, crossmatch: true, inventory: true, dghsReporting: true } },

      // ── Group C: Imaging & Scans (8) ────────────────────────────────────────
      { name: 'Radiology Center (X-Ray, CT, MRI)', slug: 'radiology-center', icon: 'ScanLine', sortOrder: 30,
        groupSlug: 'imaging',
        subtypeTagline: 'X-Ray, CT, MRI, fluoroscopy with DICOM viewer and AERB dose register.',
        volumeHint: '20–300+ scans/day',
        featureFlags: { scanReports: true, billing: true, whatsapp: true, reportDelivery: true, dicom: true, aerb: true } },
      { name: 'Ultrasound Center', slug: 'ultrasound-center', icon: 'Activity', sortOrder: 31,
        groupSlug: 'imaging',
        subtypeTagline: 'USG, Doppler, 3D/4D — includes mandatory PC-PNDT Form F compliance.',
        volumeHint: '15–200 scans/day',
        featureFlags: { scanReports: true, billing: true, whatsapp: true, reportDelivery: true, pndt: true, dicom: true } },
      { name: 'PET Scan Center', slug: 'pet-scan-center', icon: 'Target', sortOrder: 32,
        groupSlug: 'imaging',
        subtypeTagline: 'PET-CT, PET-MRI oncology imaging with radiopharmacy tracer log.',
        volumeHint: '3–50 scans/day',
        featureFlags: { scanReports: true, billing: true, whatsapp: true, appointments: true, tracerLog: true, aerb: true } },
      { name: 'Nuclear Medicine Center', slug: 'nuclear-medicine-center', icon: 'Atom', sortOrder: 33,
        groupSlug: 'imaging',
        subtypeTagline: 'SPECT, gamma camera, thyroid uptake, radioisotope therapy.',
        volumeHint: '3–40 scans/day',
        featureFlags: { scanReports: true, billing: true, whatsapp: true, appointments: true, tracerLog: true, aerb: true, barc: true } },
      { name: 'Mammography Center', slug: 'mammography-center', icon: 'Shield', sortOrder: 34,
        groupSlug: 'imaging',
        subtypeTagline: 'Screening and diagnostic mammography with BI-RADS reporting. Female radiographer mandatory.',
        volumeHint: '10–80 scans/day',
        featureFlags: { scanReports: true, billing: true, whatsapp: true, appointments: true, biRads: true, femaleRadiographer: true, aerb: true } },
      { name: 'DEXA / Bone Density Center', slug: 'dexa-center', icon: 'Bone', sortOrder: 35,
        groupSlug: 'imaging',
        subtypeTagline: 'Bone mineral density scans, body composition, fracture-risk (FRAX) assessment.',
        volumeHint: '5–80 scans/day',
        featureFlags: { scanReports: true, billing: true, whatsapp: true, appointments: true, frax: true } },
      { name: 'Dental Radiology Center', slug: 'dental-radiology-center', icon: 'Smile', sortOrder: 36,
        groupSlug: 'imaging',
        subtypeTagline: 'OPG panoramic, CBCT 3D, intraoral imaging with dentist collaboration tools.',
        volumeHint: '20–200 scans/day',
        featureFlags: { scanReports: true, billing: true, whatsapp: true, appointments: true, opgCbct: true, aerb: true } },
      { name: 'Ophthalmic Diagnostic Imaging Center', slug: 'ophthalmic-center', icon: 'Eye', sortOrder: 37,
        groupSlug: 'imaging',
        subtypeTagline: 'OCT, perimetry, fundus photography, ERG, IOLMaster for retina and glaucoma.',
        volumeHint: '10–120 patients/day',
        featureFlags: { scanReports: true, billing: true, whatsapp: true, appointments: true, oct: true, perimetry: true } },

      // ── Group D: Physiological Testing (8) ──────────────────────────────────
      { name: 'Cardiac Diagnostics Center', slug: 'cardiac-diagnostics', icon: 'Heart', sortOrder: 40,
        groupSlug: 'physiological',
        subtypeTagline: 'ECG, 2D Echo, TMT, Holter, ABPM with cardiologist review workflow.',
        volumeHint: '25–300+ patients/day',
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, reportDelivery: true, tmt: true, holter: true } },
      { name: 'Pulmonary Function Testing (PFT) Center', slug: 'pft-center', icon: 'Wind', sortOrder: 41,
        groupSlug: 'physiological',
        subtypeTagline: 'Spirometry, DLCO, FeNO, ABG, body plethysmography.',
        volumeHint: '5–80 patients/day',
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, spirometry: true } },
      { name: 'Neurophysiology (EEG/EMG) Center', slug: 'neurophysiology-center', icon: 'Brain', sortOrder: 42,
        groupSlug: 'physiological',
        subtypeTagline: 'EEG, EMG, NCS, evoked potentials with waveform capture and neurologist review.',
        volumeHint: '3–60 studies/day',
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, waveformCapture: true } },
      { name: 'Allergy Testing Center', slug: 'allergy-center', icon: 'Flower', sortOrder: 43,
        groupSlug: 'physiological',
        subtypeTagline: 'Skin prick, patch tests, challenge tests, allergen immunotherapy planning.',
        volumeHint: '5–80 patients/day',
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, allergenPanels: true } },
      { name: 'Sleep Lab / Polysomnography', slug: 'sleep-lab', icon: 'Moon', sortOrder: 44,
        groupSlug: 'physiological',
        subtypeTagline: 'Overnight polysomnography, CPAP titration, home sleep testing.',
        volumeHint: '2–30 studies/day',
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, psg: true, cpapTitration: true } },
      { name: 'Audiology & ENT Diagnostic Center', slug: 'audiology-center', icon: 'Ear', sortOrder: 45,
        groupSlug: 'physiological',
        subtypeTagline: 'Audiometry, tympanometry, BERA, OAE, VNG for hearing and balance.',
        volumeHint: '10–120 patients/day',
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, audiometry: true } },
      { name: 'Urodynamics Diagnostic Center', slug: 'urodynamics-center', icon: 'Gauge', sortOrder: 46,
        groupSlug: 'physiological',
        subtypeTagline: 'Cystometry, uroflowmetry, pressure-flow studies for bladder dysfunction.',
        volumeHint: '2–30 studies/day',
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, urodynamics: true } },
      { name: 'Endoscopy Diagnostic Center', slug: 'endoscopy-center', icon: 'Telescope', sortOrder: 47,
        groupSlug: 'physiological',
        subtypeTagline: 'Upper GI, colonoscopy, bronchoscopy with video capture and sedation tracking.',
        volumeHint: '5–60 procedures/day',
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, videoCapture: true, sedationLog: true } },

      // ── Group E: Health Packages (2) ────────────────────────────────────────
      { name: 'Health Checkup / Wellness Screening Center', slug: 'health-checkup', icon: 'ClipboardCheck', sortOrder: 50,
        groupSlug: 'packages',
        subtypeTagline: 'Comprehensive preventive checkup packages with annual recall and risk scoring.',
        volumeHint: '30–12,000 patients/month',
        featureFlags: { labReports: true, appointments: true, billing: true, whatsapp: true, packages: true, healthRiskAssessment: true } },
      { name: 'Corporate Wellness Screening', slug: 'corporate-screening', icon: 'Briefcase', sortOrder: 51,
        groupSlug: 'packages',
        subtypeTagline: 'B2B employee screening, camp management, employer dashboard, aggregate HR reports.',
        volumeHint: '50–15,000 employees/month',
        featureFlags: { labReports: true, billing: true, whatsapp: true, packages: true, bulkBooking: true, employerPortal: true, campMode: true } },

      // ── Group F: Specialty & Advanced (4) ───────────────────────────────────
      { name: 'IVF / Embryology & Andrology Lab', slug: 'ivf-embryology', icon: 'Baby', sortOrder: 60,
        groupSlug: 'specialty',
        subtypeTagline: 'Embryology, ICSI, cryopreservation, andrology — ART Act 2021 compliant.',
        volumeHint: '2–50 cycles/month',
        featureFlags: { labReports: true, billing: true, whatsapp: true, cycleTracking: true, cryopreservation: true, casa: true, artAct: true } },
      { name: 'Stem Cell & HLA / Bone Marrow Registry', slug: 'stem-cell-registry', icon: 'Layers', sortOrder: 61,
        groupSlug: 'specialty',
        subtypeTagline: 'HLA typing, bone marrow donor registry, stem cell processing — WMDA workflow.',
        volumeHint: '5–100 specimens/day',
        featureFlags: { labReports: true, billing: true, whatsapp: true, hlaTyping: true, donorRegistry: true, wmdaSync: true } },
      { name: 'Forensic / Drug Testing / Toxicology Lab', slug: 'forensic-toxicology', icon: 'Shield', sortOrder: 62,
        groupSlug: 'specialty',
        subtypeTagline: 'GC-MS/LC-MS based drug-of-abuse, doping, forensic samples with chain-of-custody.',
        volumeHint: '10–200 samples/day',
        featureFlags: { labReports: true, billing: true, whatsapp: true, chainOfCustody: true, cdsco: true, gcms: true } },
      { name: 'Cancer Screening / Early Detection Center', slug: 'cancer-screening', icon: 'ShieldAlert', sortOrder: 63,
        groupSlug: 'specialty',
        subtypeTagline: 'AI-scored tumor marker panels + imaging + clinician review. NURA-style preventive model.',
        volumeHint: '10–200 screenings/day',
        featureFlags: { labReports: true, billing: true, whatsapp: true, packages: true, tumorMarkers: true, aiScoring: true } },

      // ── Group G: Hubs & Digital Operations (3) ──────────────────────────────
      { name: 'Reference / Central Processing Lab', slug: 'reference-lab', icon: 'Network', sortOrder: 70,
        groupSlug: 'hub-digital',
        subtypeTagline: 'Central hub processing samples from 20–100+ PSCs with franchise & revenue sharing.',
        volumeHint: '300–3,000+ samples/day',
        featureFlags: { labReports: true, billing: true, whatsapp: true, hubSpoke: true, franchiseMgmt: true, revenueSharing: true, partnerLabs: true } },
      { name: 'Tele-Radiology Reporting Service', slug: 'tele-radiology', icon: 'Radio', sortOrder: 71,
        groupSlug: 'hub-digital',
        subtypeTagline: 'Remote DICOM reading for hospitals and centers with radiologist state-registration tracking.',
        volumeHint: '30–500 reports/day',
        featureFlags: { scanReports: true, billing: true, whatsapp: true, dicom: true, teleRadiology: true, nmcTracking: true } },
      { name: 'Preventive Genomics / DTC Testing Platform', slug: 'dtc-genomics', icon: 'Globe', sortOrder: 72,
        groupSlug: 'hub-digital',
        subtypeTagline: 'Direct-to-consumer saliva-kit genetic wellness, pharmacogenomics, ancestry.',
        volumeHint: '100–10,000 kits/month',
        featureFlags: { labReports: true, billing: true, whatsapp: true, kitLogistics: true, dtc: true, counselling: true } },
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
      const stData: any = {
        name: st.name,
        slug: st.slug,
        icon: st.icon,
        sortOrder: st.sortOrder,
        featureFlags: st.featureFlags,
        groupSlug: (st as any).groupSlug ?? null,
        subtypeTagline: (st as any).subtypeTagline ?? null,
        volumeHint: (st as any).volumeHint ?? null,
      };
      await prisma.tenantSubType.upsert({
        where: { portalFamilyId_slug: { portalFamilyId: pf.id, slug: st.slug } },
        create: { ...stData, portalFamilyId: pf.id },
        update: {
          name: stData.name,
          icon: stData.icon,
          sortOrder: stData.sortOrder,
          groupSlug: stData.groupSlug,
          subtypeTagline: stData.subtypeTagline,
          volumeHint: stData.volumeHint,
        },
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



// ── Diagnostic-specific WhatsApp Templates (T01–T20) ─────────────────────────

const DIAGNOSTIC_WA_TEMPLATES: Array<{
  name: string; displayName: string; category: string;
  bodyText: string; variables: string[]; buttons?: Array<{type: string; text: string}>;
}> = [
  { name: 'lab_order_confirmed',    displayName: 'T01 Lab Order Confirmed',    category: 'UTILITY',   variables: ['name','order_id','barcode','tests'],
    bodyText: 'Hi {{name}}, your lab order {{order_id}} is confirmed. Barcode: {{barcode}}. Tests: {{tests}}.' },
  { name: 'sample_collected',       displayName: 'T02 Sample Collected',        category: 'UTILITY',   variables: ['name','order_id','expected_time'],
    bodyText: 'Hi {{name}}, sample for order {{order_id}} collected. Report by {{expected_time}}.' },
  { name: 'sample_dispatched',      displayName: 'T03 Sample in Transit',       category: 'UTILITY',   variables: ['order_id','expected_time'],
    bodyText: 'Sample for order {{order_id}} in transit. Report by {{expected_time}}.' },
  { name: 'sample_rejected',        displayName: 'T04 Sample Rejected',         category: 'UTILITY',   variables: ['name','order_id','reason'],
    bodyText: 'Hi {{name}}, sample for {{order_id}} rejected. Reason: {{reason}}. Please visit for re-collection.' },
  { name: 'report_ready_normal',    displayName: 'T05 Report Ready Normal',     category: 'UTILITY',   variables: ['name','order_id','report_link'],
    bodyText: 'Hi {{name}}, report for {{order_id}} ready. All values normal. Download: {{report_link}}' },
  { name: 'report_ready_abnormal',  displayName: 'T06 Report Ready Abnormal',   category: 'UTILITY',   variables: ['name','order_id','report_link'],
    bodyText: 'Hi {{name}}, report for {{order_id}} ready. Some values abnormal - consult your doctor. Download: {{report_link}}' },
  { name: 'critical_value_alert',   displayName: 'T07 Critical Value Alert',    category: 'UTILITY',   variables: ['patient_name','order_id','test_name','value','threshold','alert_id'],
    bodyText: 'CRITICAL: Patient {{patient_name}}, Order {{order_id}}, Test {{test_name}}: {{value}} (Threshold {{threshold}}). Reply ACK {{alert_id}} to acknowledge.' },
  { name: 'sample_at_lab',          displayName: 'T08 Sample at Lab',           category: 'UTILITY',   variables: ['name','order_id','expected_time'],
    bodyText: 'Hi {{name}}, sample for {{order_id}} received at lab. Processing started. Report by {{expected_time}}.' },
  { name: 'report_amended',         displayName: 'T09 Report Amended',          category: 'UTILITY',   variables: ['name','order_id','reason','report_link'],
    bodyText: 'Hi {{name}}, report for {{order_id}} updated. Reason: {{reason}}. New report: {{report_link}}' },
  { name: 'test_in_progress',       displayName: 'T10 Tests In Progress',       category: 'UTILITY',   variables: ['order_id','expected_time'],
    bodyText: 'Tests for order {{order_id}} are processing. Report expected by {{expected_time}}.' },
  { name: 'home_collection_booked', displayName: 'T11 Home Collection Booked',  category: 'UTILITY',   variables: ['name','date','time','address'],
    bodyText: 'Hi {{name}}, home collection confirmed! Date: {{date}}, Time: {{time}}, Address: {{address}}. Reply CANCEL to cancel.' },
  { name: 'agent_assigned',         displayName: 'T12 Agent Assigned',          category: 'UTILITY',   variables: ['name','agent_name','date','time'],
    bodyText: 'Hi {{name}}, agent {{agent_name}} assigned for collection on {{date}} at {{time}}.' },
  { name: 'collection_reminder',    displayName: 'T13 Collection Reminder',     category: 'UTILITY',   variables: ['time','address','fasting_required'],
    bodyText: 'Reminder: Home collection today at {{time}} at {{address}}. Fasting required: {{fasting_required}}.' },
  { name: 'corporate_wellness',     displayName: 'T14 Corporate Wellness',      category: 'UTILITY',   variables: ['name','company','deadline','booking_link'],
    bodyText: 'Hi {{name}}, {{company}} arranged a health checkup. Book by {{deadline}} at {{booking_link}}.' },
  { name: 'retest_reminder_90d',    displayName: 'T15 Re-test Reminder 90 Days', category: 'MARKETING', variables: ['name','test_name'],
    bodyText: 'Hi {{name}}, it has been 90 days since your last {{test_name}} test. Book today for same-day results! Reply BOOK to confirm or STOP to unsubscribe.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Book Now' }, { type: 'QUICK_REPLY', text: 'Remind Later' }, { type: 'QUICK_REPLY', text: 'Stop' }] },
  { name: 'abnormal_followup',      displayName: 'T16 Abnormal Result Followup', category: 'UTILITY',  variables: ['name','test_name'],
    bodyText: 'Hi {{name}}, your recent {{test_name}} showed abnormal values. Schedule a follow-up test? Reply BOOK to confirm.',
    buttons: [{ type: 'QUICK_REPLY', text: 'Book Follow-up' }, { type: 'QUICK_REPLY', text: 'I Have a Doctor' }] },
  { name: 'annual_health_package',  displayName: 'T17 Annual Health Package',   category: 'MARKETING', variables: ['name','package_name','tests','price','booking_link'],
    bodyText: 'Hi {{name}}, time for your annual checkup! {{package_name}} package ({{tests}} tests) at Rs {{price}}. Book at {{booking_link}}' },
  { name: 'loyalty_offer',          displayName: 'T18 Loyalty Discount',        category: 'MARKETING', variables: ['name','visit_count','discount','expiry'],
    bodyText: 'Hi {{name}}, thank you for {{visit_count}} visits! Enjoy {{discount}}% off your next test. Valid until {{expiry}}.' },
  { name: 'doctor_report_delivery', displayName: 'T19 Report to Doctor',        category: 'UTILITY',   variables: ['patient_name','order_id','abnormal_flag','report_link'],
    bodyText: 'Lab Report: Patient {{patient_name}}, Order {{order_id}}. {{abnormal_flag}} View: {{report_link}}' },
  { name: 'birthday_health_offer',  displayName: 'T20 Birthday Health Offer',   category: 'MARKETING', variables: ['name','booking_link'],
    bodyText: 'Happy Birthday {{name}}! Enjoy 20% off any health package this month. Book at {{booking_link}}' },
];
async function seedDiagnosticWATemplates() {
  let seeded = 0;
  for (const tmpl of DIAGNOSTIC_WA_TEMPLATES) {
    await prisma.whatsappTemplate.upsert({
      where: { name_tenantId: { name: tmpl.name, tenantId: null } } as any,
      create: {
        ...(tmpl as any),
        tenantId: null,
        isDefault: true,
        status: 'APPROVED',
        buttons: (tmpl as any).buttons ?? [],
      },
      update: { status: 'APPROVED' },
    }).catch(() => {});
    seeded++;
  }
  console.log(`✅ ${seeded} diagnostic WhatsApp templates seeded`);
}

// ── Diagnostic Recharge Packs seed ──────────────────────────────────────────

const RECHARGE_PACKS = [
  // WhatsApp
  { packType: 'WHATSAPP', name: '500 WA Credits',    creditsOrUnits: 500,   priceInclGst: 59000,  priceExclGst: 50000,  gstRate: 0.18, sortOrder: 1, isActive: true },
  { packType: 'WHATSAPP', name: '2,000 WA Credits',  creditsOrUnits: 2000,  priceInclGst: 199000, priceExclGst: 168644, gstRate: 0.18, sortOrder: 2, isActive: true },
  { packType: 'WHATSAPP', name: '10,000 WA Credits', creditsOrUnits: 10000, priceInclGst: 799000, priceExclGst: 677966, gstRate: 0.18, sortOrder: 3, isActive: true },
  // SMS
  { packType: 'SMS', name: '500 SMS',    creditsOrUnits: 500,   priceInclGst: 29000,  priceExclGst: 24576,  gstRate: 0.18, sortOrder: 1, isActive: true },
  { packType: 'SMS', name: '2,000 SMS',  creditsOrUnits: 2000,  priceInclGst: 99000,  priceExclGst: 83898,  gstRate: 0.18, sortOrder: 2, isActive: true },
  { packType: 'SMS', name: '10,000 SMS', creditsOrUnits: 10000, priceInclGst: 399000, priceExclGst: 338136, gstRate: 0.18, sortOrder: 3, isActive: true },
  // Storage
  { packType: 'STORAGE', name: '10 GB Extra Storage',  creditsOrUnits: 10,  priceInclGst: 59000,  priceExclGst: 50000,  gstRate: 0.18, sortOrder: 1, isActive: true },
  { packType: 'STORAGE', name: '50 GB Extra Storage',  creditsOrUnits: 50,  priceInclGst: 199000, priceExclGst: 168644, gstRate: 0.18, sortOrder: 2, isActive: true },
  { packType: 'STORAGE', name: '200 GB Extra Storage', creditsOrUnits: 200, priceInclGst: 599000, priceExclGst: 507627, gstRate: 0.18, sortOrder: 3, isActive: true },
];

async function seedRechargePacks() {
  let seeded = 0;
  for (const pack of RECHARGE_PACKS) {
    await (prisma as any).rechargePack.upsert({
      where: { id: `pack-${pack.packType.toLowerCase()}-${pack.sortOrder}` },
      create: { id: `pack-${pack.packType.toLowerCase()}-${pack.sortOrder}`, ...pack },
      update: { priceInclGst: pack.priceInclGst, isActive: true },
    }).catch(() => {
      return (prisma as any).rechargePack.create({ data: pack }).catch(() => {});
    });
    seeded++;
  }
  console.log(`✅ ${seeded} recharge packs seeded`);
}

// ── Subtype Groups (Diagnostic only for now) ────────────────────────────────
// These seven operational groups partition the 34 diagnostic subtypes for the
// registration wizard's group-picker step.

const DIAGNOSTIC_SUBTYPE_GROUPS = [
  { slug: 'collection', name: 'Collection & Logistics', icon: 'Droplet',
    description: 'Sample pickup centers, pickup points, and home collection services.',
    sortOrder: 1 },
  { slug: 'pathology', name: 'Pathology & Lab Testing', icon: 'TestTube',
    description: 'In-house blood tests, cultures, biopsies, PCR, genetics, blood banks.',
    sortOrder: 2 },
  { slug: 'imaging', name: 'Imaging & Scans', icon: 'ScanLine',
    description: 'X-Ray, CT, MRI, USG, PET, nuclear medicine, mammography, DEXA, dental, ophthalmic.',
    sortOrder: 3 },
  { slug: 'physiological', name: 'Physiological Testing', icon: 'Activity',
    description: 'Cardiac, pulmonary, neuro, sleep, audiology, endoscopy — body-function studies.',
    sortOrder: 4 },
  { slug: 'packages', name: 'Health Packages', icon: 'ClipboardCheck',
    description: 'Preventive checkup packages and corporate wellness screening.',
    sortOrder: 5 },
  { slug: 'specialty', name: 'Specialty & Advanced', icon: 'Sparkles',
    description: 'IVF, stem cell registry, forensic testing, AI-powered cancer screening.',
    sortOrder: 6 },
  { slug: 'hub-digital', name: 'Hubs & Digital', icon: 'Network',
    description: 'Reference labs, tele-radiology reporting, direct-to-consumer genomics platforms.',
    sortOrder: 7 },
];

async function seedSubtypeGroups() {
  const diagnostic = await prisma.portalFamily.findUnique({ where: { slug: 'diagnostic' } });
  if (!diagnostic) {
    console.log('⚠️  Diagnostic portal family not found — skipping subtype groups seed');
    return;
  }

  let seeded = 0;
  for (const g of DIAGNOSTIC_SUBTYPE_GROUPS) {
    await (prisma as any).subtypeGroup.upsert({
      where: { portalFamilyId_slug: { portalFamilyId: diagnostic.id, slug: g.slug } },
      create: { ...g, portalFamilyId: diagnostic.id },
      update: { name: g.name, description: g.description, icon: g.icon, sortOrder: g.sortOrder },
    }).catch((err: any) => {
      console.warn(`⚠️  Could not upsert subtype group ${g.slug}: ${err?.message ?? err}`);
    });
    seeded++;
  }
  console.log(`✅ ${seeded} diagnostic subtype groups seeded`);
}

async function runAll() {
  await main();
  await migrateExistingTenants();
  await seedWATemplates();
  await seedRechargePacks();
  await seedDiagnosticWATemplates();
  await seedSubtypeGroups();
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
