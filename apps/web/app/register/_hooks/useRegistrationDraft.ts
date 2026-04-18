'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { WizardState, emptyWizardState, StepId } from '../_lib/wizard-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * useRegistrationDraft — owns the wizard's full state and auto-persists it
 * to the server as a RegistrationDraft so the user can resume from any device.
 *
 * The draft token lives in localStorage so a browser refresh resumes locally
 * without a round-trip. On first "next" after step 1 we create the draft and
 * remember the token; on every subsequent step change we PATCH it.
 *
 * Save is fire-and-forget with a short debounce — failures don't block the UI.
 * The wizard is still fully functional even if every save fails (the final
 * submit is the single source of truth that actually creates the tenant).
 */
export function useRegistrationDraft() {
  const [state, setState] = useState<WizardState>(emptyWizardState);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<any>(null);

  // Hydrate from localStorage on mount (resume-from-refresh support)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('hospibot_registration_draft') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setState((s) => ({ ...s, ...parsed }));
      }
    } catch {/* ignore */}
    setHydrated(true);
  }, []);

  // Persist locally every change so a refresh/close doesn't lose context
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('hospibot_registration_draft', JSON.stringify(state));
    } catch {/* ignore quota */}
  }, [state, hydrated]);

  /** Apply a partial patch to the state. */
  const patch = useCallback((partial: Partial<WizardState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  /** Apply a deep patch to `facility` without clobbering other fields. */
  const patchFacility = useCallback((partial: Partial<WizardState['facility']>) => {
    setState((s) => ({ ...s, facility: { ...s.facility, ...partial } }));
  }, []);

  const patchAdmin = useCallback((partial: Partial<WizardState['admin']>) => {
    setState((s) => ({ ...s, admin: { ...s.admin, ...partial } }));
  }, []);

  /**
   * Go to a specific step and schedule a background save to the server.
   * The server-side draft is best-effort: we don't await it so navigation
   * never waits on the network.
   */
  const goToStep = useCallback((step: StepId) => {
    setState((s) => ({ ...s, currentStep: step }));
    scheduleSave();
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void saveDraft(); }, 400);
  }, []);

  /**
   * Create-or-update the server draft. First call (no token yet) POSTs to
   * create; subsequent calls PATCH the existing draft.
   */
  const saveDraft = useCallback(async () => {
    // Read current state at call time — ref pattern would be nicer, but
    // setState's functional form below gives us the live snapshot.
    setState((cur) => {
      const payload = {
        currentStep: cur.currentStep,
        groupSlug: cur.groupSlug,
        subtypeSlug: cur.subtypeSlug,
        tierKey: cur.tierKey,
        billingCycle: cur.billingCycle,
        facilityDetails: cur.facility,
        adminEmail: cur.admin.email || null,
        adminPhone: cur.admin.phone || null,
      };

      if (cur.draftToken) {
        axios.patch(`${API_URL}/portal/registration-drafts/${cur.draftToken}`, payload).catch(() => {});
      } else if (cur.currentStep > 1) {
        // Only create the server draft once we're past the welcome step —
        // no point polluting the DB with abandoned step-1 visits.
        axios.post(`${API_URL}/portal/registration-drafts`, {
          portalFamily: cur.portalFamily,
          ...payload,
        }).then((res) => {
          const token = res?.data?.token;
          if (token && !token.startsWith('ephemeral-')) {
            setState((s) => ({ ...s, draftToken: token }));
          }
        }).catch(() => {/* silent — ephemeral session */});
      }
      return cur;
    });
  }, []);

  const reset = useCallback(() => {
    setState(emptyWizardState);
    try { localStorage.removeItem('hospibot_registration_draft'); } catch {/* ignore */}
  }, []);

  return { state, hydrated, patch, patchFacility, patchAdmin, goToStep, saveDraft, reset };
}
