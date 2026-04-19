/**
 * PC-PNDT Register — referenced by radiology-center and ultrasound-center
 * subtype nav configs. The functional implementation lives under
 * /diagnostic/compliance/form-f, which manages PC-PNDT Form F records per
 * the PC-PNDT Act, 1994. This page is a redirect alias so the subtype nav
 * link works immediately.
 */

import { redirect } from 'next/navigation';

export default function PndtRegisterAlias() {
  redirect('/diagnostic/compliance/form-f');
}
