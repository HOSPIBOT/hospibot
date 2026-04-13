'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type SupportedLocale = 'en' | 'hi' | 'te' | 'ar';

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
  ar: 'العربية',
};

// ── Translation strings ────────────────────────────────────────────────────
const TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard':       'Dashboard',
    'nav.patients':        'Patients',
    'nav.appointments':    'Appointments',
    'nav.prescriptions':   'Prescriptions',
    'nav.lab':             'Lab Orders',
    'nav.billing':         'Billing',
    'nav.whatsapp':        'WhatsApp Inbox',
    'nav.crm':             'CRM / Leads',
    'nav.analytics':       'Analytics',
    'nav.settings':        'Settings',
    'nav.staff':           'Staff',
    'nav.doctors':         'Doctors',
    'nav.beds':            'Bed Management',
    'nav.ot':              'Operation Theatre',
    'nav.discharge':       'Discharge Summary',
    'nav.vaccinations':    'Vaccinations',
    'nav.telemedicine':    'Telemedicine',

    // Common actions
    'action.save':         'Save',
    'action.cancel':       'Cancel',
    'action.delete':       'Delete',
    'action.edit':         'Edit',
    'action.add':          'Add',
    'action.search':       'Search',
    'action.export':       'Export',
    'action.send':         'Send',
    'action.confirm':      'Confirm',
    'action.refresh':      'Refresh',
    'action.back':         'Back',
    'action.close':        'Close',
    'action.view':         'View',
    'action.book':         'Book',

    // Patient
    'patient.name':        'Patient Name',
    'patient.phone':       'Phone',
    'patient.dob':         'Date of Birth',
    'patient.gender':      'Gender',
    'patient.blood_group': 'Blood Group',
    'patient.allergies':   'Allergies',
    'patient.address':     'Address',
    'patient.health_id':   'Health ID',

    // Appointment
    'appt.date':           'Date',
    'appt.time':           'Time',
    'appt.doctor':         'Doctor',
    'appt.status':         'Status',
    'appt.type':           'Type',
    'appt.notes':          'Notes',

    // Billing
    'bill.total':          'Total Amount',
    'bill.paid':           'Paid Amount',
    'bill.due':            'Due Amount',
    'bill.status':         'Status',
    'bill.gst':            'GST',

    // Status labels
    'status.active':       'Active',
    'status.pending':      'Pending',
    'status.completed':    'Completed',
    'status.cancelled':    'Cancelled',
    'status.confirmed':    'Confirmed',

    // WhatsApp
    'wa.send':             'Send via WhatsApp',
    'wa.inbox':            'WhatsApp Inbox',
    'wa.template':         'Template',
    'wa.message':          'Message',

    // Dashboard
    'dash.total_patients':    'Total Patients',
    'dash.today_appts':       'Today\'s Appointments',
    'dash.revenue':           'Revenue',
    'dash.pending_lab':       'Pending Lab Orders',
  },

  hi: {
    // Navigation
    'nav.dashboard':       'डैशबोर्ड',
    'nav.patients':        'मरीज़',
    'nav.appointments':    'अपॉइंटमेंट',
    'nav.prescriptions':   'नुस्खे',
    'nav.lab':             'लैब ऑर्डर',
    'nav.billing':         'बिलिंग',
    'nav.whatsapp':        'व्हाट्सएप इनबॉक्स',
    'nav.crm':             'सीआरएम / लीड्स',
    'nav.analytics':       'विश्लेषण',
    'nav.settings':        'सेटिंग्स',
    'nav.staff':           'कर्मचारी',
    'nav.doctors':         'डॉक्टर',
    'nav.beds':            'बेड प्रबंधन',
    'nav.ot':              'ऑपरेशन थियेटर',
    'nav.discharge':       'छुट्टी सारांश',
    'nav.vaccinations':    'टीकाकरण',
    'nav.telemedicine':    'टेलीमेडिसिन',

    // Common actions
    'action.save':         'सहेजें',
    'action.cancel':       'रद्द करें',
    'action.delete':       'हटाएं',
    'action.edit':         'संपादित करें',
    'action.add':          'जोड़ें',
    'action.search':       'खोजें',
    'action.export':       'निर्यात करें',
    'action.send':         'भेजें',
    'action.confirm':      'पुष्टि करें',
    'action.refresh':      'रीफ्रेश',
    'action.back':         'वापस',
    'action.close':        'बंद करें',
    'action.view':         'देखें',
    'action.book':         'बुक करें',

    // Patient
    'patient.name':        'मरीज़ का नाम',
    'patient.phone':       'फ़ोन',
    'patient.dob':         'जन्म तिथि',
    'patient.gender':      'लिंग',
    'patient.blood_group': 'रक्त समूह',
    'patient.allergies':   'एलर्जी',
    'patient.address':     'पता',
    'patient.health_id':   'स्वास्थ्य आईडी',

    // Appointment
    'appt.date':           'तारीख़',
    'appt.time':           'समय',
    'appt.doctor':         'डॉक्टर',
    'appt.status':         'स्थिति',
    'appt.type':           'प्रकार',
    'appt.notes':          'नोट्स',

    // Billing
    'bill.total':          'कुल राशि',
    'bill.paid':           'भुगतान राशि',
    'bill.due':            'बकाया राशि',
    'bill.status':         'स्थिति',
    'bill.gst':            'जीएसटी',

    // Status labels
    'status.active':       'सक्रिय',
    'status.pending':      'लंबित',
    'status.completed':    'पूर्ण',
    'status.cancelled':    'रद्द',
    'status.confirmed':    'पुष्टित',

    // WhatsApp
    'wa.send':             'व्हाट्सएप से भेजें',
    'wa.inbox':            'व्हाट्सएप इनबॉक्स',
    'wa.template':         'टेम्पलेट',
    'wa.message':          'संदेश',

    // Dashboard
    'dash.total_patients':    'कुल मरीज़',
    'dash.today_appts':       'आज के अपॉइंटमेंट',
    'dash.revenue':           'राजस्व',
    'dash.pending_lab':       'लंबित लैब ऑर्डर',
  },

  te: {
    'nav.dashboard':       'డాష్‌బోర్డ్',
    'nav.patients':        'రోగులు',
    'nav.appointments':    'అపాయింట్‌మెంట్స్',
    'nav.prescriptions':   'మందుల చీటీలు',
    'nav.lab':             'లాబ్ ఆర్డర్లు',
    'nav.billing':         'బిల్లింగ్',
    'nav.whatsapp':        'వాట్సాప్ ఇన్‌బాక్స్',
    'nav.analytics':       'విశ్లేషణ',
    'nav.settings':        'సెట్టింగులు',
    'nav.staff':           'సిబ్బంది',
    'nav.doctors':         'డాక్టర్లు',
    'nav.beds':            'పడక నిర్వహణ',
    'nav.ot':              'ఆపరేషన్ థియేటర్',
    'nav.discharge':       'డిశ్చార్జ్ సారాంశం',
    'nav.vaccinations':    'టీకాలు',
    'nav.telemedicine':    'టెలిమెడిసిన్',
    'action.save':         'సేవ్ చేయి',
    'action.cancel':       'రద్దు చేయి',
    'action.search':       'వెతుకు',
    'action.export':       'ఎగుమతి',
    'action.send':         'పంపు',
    'action.book':         'బుక్ చేయి',
    'patient.name':        'రోగి పేరు',
    'patient.phone':       'ఫోన్',
    'patient.dob':         'పుట్టిన తేదీ',
    'dash.total_patients': 'మొత్తం రోగులు',
    'dash.today_appts':    'నేటి అపాయింట్‌మెంట్స్',
    'dash.revenue':        'ఆదాయం',
    'wa.send':             'వాట్సాప్ ద్వారా పంపు',
    'status.active':       'సక్రియ',
    'status.pending':      'పెండింగ్',
    'status.completed':    'పూర్తైంది',
    'status.cancelled':    'రద్దయింది',
  },

  ar: {
    'nav.dashboard':       'لوحة التحكم',
    'nav.patients':        'المرضى',
    'nav.appointments':    'المواعيد',
    'nav.prescriptions':   'الوصفات الطبية',
    'nav.lab':             'طلبات المختبر',
    'nav.billing':         'الفواتير',
    'nav.whatsapp':        'صندوق واتساب',
    'nav.analytics':       'التحليلات',
    'nav.settings':        'الإعدادات',
    'nav.staff':           'الموظفون',
    'nav.doctors':         'الأطباء',
    'nav.beds':            'إدارة الأسرّة',
    'nav.ot':              'غرفة العمليات',
    'nav.discharge':       'ملخص الخروج',
    'nav.vaccinations':    'التطعيمات',
    'nav.telemedicine':    'الطب عن بُعد',
    'action.save':         'حفظ',
    'action.cancel':       'إلغاء',
    'action.search':       'بحث',
    'action.export':       'تصدير',
    'action.send':         'إرسال',
    'action.book':         'حجز',
    'patient.name':        'اسم المريض',
    'patient.phone':       'الهاتف',
    'patient.dob':         'تاريخ الميلاد',
    'dash.total_patients': 'إجمالي المرضى',
    'dash.today_appts':    'مواعيد اليوم',
    'dash.revenue':        'الإيرادات',
    'wa.send':             'إرسال عبر واتساب',
    'status.active':       'نشط',
    'status.pending':      'قيد الانتظار',
    'status.completed':    'مكتمل',
    'status.cancelled':    'ملغى',
  },
};

// ── i18n Context ──────────────────────────────────────────────────────────
interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key, fallback) => fallback || key,
  isRTL: false,
});

const RTL_LOCALES: SupportedLocale[] = ['ar'];

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem('hospibot_locale') as SupportedLocale) || 'en';
  });

  const setLocale = useCallback((l: SupportedLocale) => {
    setLocaleState(l);
    localStorage.setItem('hospibot_locale', l);
    document.documentElement.lang = l;
    document.documentElement.dir  = RTL_LOCALES.includes(l) ? 'rtl' : 'ltr';
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    const translations = TRANSLATIONS[locale] || TRANSLATIONS.en;
    return translations[key] || TRANSLATIONS.en[key] || fallback || key;
  }, [locale]);

  const isRTL = RTL_LOCALES.includes(locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

// ── Language Switcher Component ────────────────────────────────────────────
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <select
      value={locale}
      onChange={e => setLocale(e.target.value as SupportedLocale)}
      className={`text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 outline-none cursor-pointer ${className}`}
      title="Change language"
    >
      {(Object.entries(LOCALE_NAMES) as [SupportedLocale, string][]).map(([code, name]) => (
        <option key={code} value={code}>{name}</option>
      ))}
    </select>
  );
}
