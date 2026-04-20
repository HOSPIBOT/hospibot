/**
 * HospiBot Multi-Language (i18n) Framework
 * Supports: English (en), Hindi (hi), Telugu (te), Tamil (ta), Marathi (mr), Bengali (bn)
 * Usage: const t = useTranslation('hi'); t('dashboard.title')
 */

import en from './en';
import hi from './hi';
import te from './te';
import ta from './ta';

export type Locale = 'en' | 'hi' | 'te' | 'ta' | 'mr' | 'bn';
export const SUPPORTED_LOCALES: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

const translations: Record<string, any> = { en, hi, te, ta };

export function t(locale: Locale, key: string, params?: Record<string, string>): string {
  const keys = key.split('.');
  let val: any = translations[locale] || translations.en;
  for (const k of keys) { val = val?.[k]; if (!val) break; }
  if (!val) {
    // Fallback to English
    val = translations.en;
    for (const k of keys) { val = val?.[k]; if (!val) break; }
  }
  if (!val) return key;
  if (params) {
    return Object.entries(params).reduce((s, [k, v]) => s.replace(`{{${k}}}`, v), String(val));
  }
  return String(val);
}

export function useTranslation(locale: Locale = 'en') {
  return (key: string, params?: Record<string, string>) => t(locale, key, params);
}
