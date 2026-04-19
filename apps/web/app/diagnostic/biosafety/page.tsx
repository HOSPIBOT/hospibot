/**
 * Biosafety Log — referenced by the molecular-lab subtype nav config. The
 * functional implementation lives under /diagnostic/compliance/biosafety,
 * which manages ICMR BSL-2 compliance checklists. This page is a redirect
 * alias so the subtype nav link works immediately.
 */

import { redirect } from 'next/navigation';

export default function BiosafetyAlias() {
  redirect('/diagnostic/compliance/biosafety');
}
