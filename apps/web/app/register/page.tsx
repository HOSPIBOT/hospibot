'use client';

/**
 * HospiBot Diagnostic Registration — 7-step wizard (centered single-column).
 *
 * Final submit flow:
 *   Steps 1-5 collect data into the wizard state (persisted to the server
 *   as a RegistrationDraft for resume-from-any-device).
 *   Step 6's "Continue" button triggers submitRegistration() which POSTs to
 *   the existing /auth/register endpoint — the DTO shape is unchanged from
 *   the old split-screen flow. On success we advance to Step 7 and store
 *   the returned tokens so the user can jump into their portal.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useRegistrationDraft } from './_hooks/useRegistrationDraft';
import { useDiagnosticGroups, useDiagnosticSubtypes } from './_hooks/useDiagnosticCatalog';
import WizardShell from './_components/WizardShell';
import Step1Welcome from './_steps/Step1Welcome';
import Step2GroupPicker from './_steps/Step2GroupPicker';
import Step3SubtypePicker from './_steps/Step3SubtypePicker';
import Step4TierPicker from './_steps/Step4TierPicker';
import Step5FacilityDetails from './_steps/Step5FacilityDetails';
import Step6AdminAccount from './_steps/Step6AdminAccount';
import Step7Welcome from './_steps/Step7Welcome';
import { StepId, TOKENS } from './_lib/wizard-types';

export default function RegisterPage() {
  const router = useRouter();
  const { state, patch, patchFacility, patchAdmin, goToStep, reset } = useRegistrationDraft();
  const { groups } = useDiagnosticGroups();
  const { subtypes } = useDiagnosticSubtypes(state.groupSlug);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ── Derived values ───────────────────────────────────────────────── */

  const currentGroupName = useMemo(
    () => groups?.find((g) => g.slug === state.groupSlug)?.name,
    [groups, state.groupSlug],
  );

  const currentSubtypeName = useMemo(
    () => subtypes?.find((s) => s.slug === state.subtypeSlug)?.name || state.subtypeSlug || '',
    [subtypes, state.subtypeSlug],
  );

  const step = state.currentStep;

  /* ── Per-step validation: when should Continue be disabled? ──────── */

  const nextDisabled = (() => {
    const s = state;
    if (step === 2) return !s.groupSlug;
    if (step === 3) return !s.subtypeSlug;
    if (step === 4) return !s.tierKey;
    if (step === 5) {
      // Required on every tier: name, slug, phone, email, address, city, state, pincode
      const f = s.facility;
      if (!f.name || !f.slug || !f.phone || !f.email
          || !f.address || !f.city || !f.state || f.pincode.length !== 6) return true;
      // Medium+ requires GST + collectionPoints
      if (s.tierKey === 'medium' || s.tierKey === 'large' || s.tierKey === 'enterprise') {
        if (!f.gstNumber || !f.collectionPoints) return true;
      }
      // Large+ requires branch count
      if (s.tierKey === 'large' || s.tierKey === 'enterprise') {
        if (!f.branchCount) return true;
      }
      // Enterprise requires group details
      if (s.tierKey === 'enterprise') {
        if (!f.groupName || !f.isFranchise || !f.monthlyVolume) return true;
      }
      return false;
    }
    if (step === 6) {
      const a = s.admin;
      if (!a.firstName || !a.email || !a.password) return true;
      if (a.password.length < 8) return true;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) return true;
      return submitting;
    }
    return false;
  })();

  /* ── Navigation + final submit ─────────────────────────────────────── */

  const handleNext = async () => {
    if (step === 6) {
      await submitRegistration();
      return;
    }
    if (step < 7) goToStep((step + 1) as StepId);
  };

  const handleBack = () => {
    if (step > 1 && step < 7) goToStep((step - 1) as StepId);
  };

  async function submitRegistration() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const s = state;
      // Map tier → legacy PlanType enum (the backend still expects it)
      const plan = s.tierKey === 'enterprise' ? 'ENTERPRISE'
                 : s.tierKey === 'large'      ? 'GROWTH'
                 :                              'STARTER';

      await api.post('/auth/register', {
        // Organization
        name: s.facility.name,
        slug: s.facility.slug,
        phone: s.facility.phone,
        email: s.facility.email || s.admin.email,
        address: s.facility.address,
        city: s.facility.city,
        state: s.facility.state,
        country: 'India',
        pincode: s.facility.pincode,
        gstNumber: s.facility.gstNumber || undefined,
        // Portal routing
        portalFamily: s.portalFamily,
        subTypeSlug: s.subtypeSlug,
        labTier: s.tierKey || undefined,
        plan,
        // Tier-specific extras (backend collects these into tenant.settings.tierDetails)
        nablNumber: s.facility.nablNumber || undefined,
        collectionPoints: s.facility.collectionPoints || undefined,
        branchCount: s.facility.branchCount || undefined,
        analyserBrands: s.facility.analyserBrands || undefined,
        groupName: s.facility.groupName || undefined,
        isFranchise: s.facility.isFranchise || undefined,
        existingSoftware: s.facility.existingSoftware || undefined,
        monthlyVolume: s.facility.monthlyVolume || undefined,
        // Admin
        adminFirstName: s.admin.firstName,
        adminLastName:  s.admin.lastName || undefined,
        adminEmail:     s.admin.email,
        adminPassword:  s.admin.password,
      });
      goToStep(7);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  function gotoPortal() {
    reset();
    router.push(`/${state.portalFamily}/login`);
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <WizardShell
      step={step}
      onBack={step > 1 && step < 7 ? handleBack : undefined}
      onNext={step < 7 ? handleNext : undefined}
      nextDisabled={nextDisabled}
      nextLabel={
        step === 1 ? "Let's begin" :
        step === 6 ? (submitting ? 'Creating…' : 'Create my portal') :
        'Continue'
      }
      hideBack={step === 1 || step === 7}
      hideNext={step === 7}
    >
      {step === 1 && <Step1Welcome />}

      {step === 2 && (
        <Step2GroupPicker
          value={state.groupSlug}
          onChange={(slug) => patch({
            groupSlug: slug,
            // Reset downstream selections when the group changes
            subtypeSlug: state.groupSlug === slug ? state.subtypeSlug : null,
          })}
        />
      )}

      {step === 3 && (
        <Step3SubtypePicker
          groupSlug={state.groupSlug}
          groupName={currentGroupName}
          value={state.subtypeSlug}
          onChange={(slug) => patch({ subtypeSlug: slug })}
        />
      )}

      {step === 4 && (
        <Step4TierPicker
          familySlug={state.portalFamily}
          subtypeSlug={state.subtypeSlug}
          value={state.tierKey}
          billingCycle={state.billingCycle}
          onChange={(tier) => patch({ tierKey: tier })}
          onBillingCycleChange={(cycle) => patch({ billingCycle: cycle })}
        />
      )}

      {step === 5 && (
        <Step5FacilityDetails
          tier={state.tierKey}
          subtypeSlug={state.subtypeSlug}
          value={state.facility}
          onChange={patchFacility}
        />
      )}

      {step === 6 && (
        <Step6AdminAccount
          value={state.admin}
          onChange={patchAdmin}
          submitting={submitting}
          submitError={submitError}
        />
      )}

      {step === 7 && (
        <Step7Welcome
          facilityName={state.facility.name}
          subtypeSlug={state.subtypeSlug}
          subtypeName={currentSubtypeName}
          tier={state.tierKey}
          portalSlug={state.portalFamily}
          onGotoPortal={gotoPortal}
        />
      )}
    </WizardShell>
  );
}
