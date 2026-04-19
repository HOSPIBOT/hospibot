/**
 * AERB Radiation Log — referenced by radiology-center and pet-scan-center
 * subtype nav configs. The functional implementation lives under
 * /diagnostic/compliance/aerb, which manages radiation dose entries per the
 * Atomic Energy (Radiation Protection) Rules, 2004. This page is a redirect
 * alias so the subtype nav link works immediately.
 */

import { redirect } from 'next/navigation';

export default function AerbLogAlias() {
  redirect('/diagnostic/compliance/aerb');
}
