'use client';

import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import TextField from '../_components/TextField';
import { Heading } from '../_components/Heading';
import { TOKENS, WizardState } from '../_lib/wizard-types';
import { DIAGNOSTIC_TIERS, type LabTier } from '@/lib/diagnostic-tiers';

interface Props {
  tier: LabTier | null;
  subtypeSlug: string | null;
  value: WizardState['facility'];
  onChange: (partial: Partial<WizardState['facility']>) => void;
}

/**
 * Step 5 — Facility details (tier-adaptive form).
 *
 * The form grows with the tier per the audited RegisterTenantDto:
 *   Small      : name, slug, phone, email, address, city, state, pincode
 *   Medium+    : + GST, NABL (optional), collection points
 *   Large+     : + NABL mandatory, branch count, analyser brands
 *   Enterprise : + group/chain name, franchise model, existing software, monthly volume
 *
 * Subtype-specific mandatory fields (PNDT CA for USG, AERB licence for
 * radiology/PET, female radiographer ID for mammography) are added in
 * Sprint 3 compliance work — this step ships with tier fields only.
 */
export default function Step5FacilityDetails({
  tier, subtypeSlug, value, onChange,
}: Props) {
  const tierConfig = tier ? DIAGNOSTIC_TIERS.find((t) => t.id === tier) : null;
  const formExtras = new Set(tierConfig?.formExtras ?? []);

  // Auto-slug: generate URL slug from lab name on first blur
  const handleNameChange = (name: string) => {
    const patch: Partial<WizardState['facility']> = { name };
    if (!value.slug) {
      patch.slug = name.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    }
    onChange(patch);
  };

  return (
    <div>
      <Heading
        title="Tell us about your facility"
        subtitle="These details go into your portal's header, reports, and invoices. You can update them later from Settings."
      />

      <FormSection title="Basic information">
        <Row>
          <TextField
            label="Lab / facility name"
            value={value.name}
            onChange={handleNameChange}
            placeholder="e.g. Sunrise Diagnostics"
            required
            icon={<Building2 size={16} />}
          />
        </Row>
        <Row>
          <TextField
            label="URL slug"
            value={value.slug}
            onChange={(v) => onChange({ slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="sunrise-diagnostics"
            required
            helper="Used in your portal URL. Lowercase letters, numbers and hyphens only."
          />
        </Row>
        <TwoColumn>
          <TextField
            label="Primary phone"
            value={value.phone}
            onChange={(v) => onChange({ phone: v })}
            placeholder="98765 43210"
            prefix="+91"
            required
            icon={<Phone size={16} />}
            type="tel"
          />
          <TextField
            label="Primary email"
            value={value.email}
            onChange={(v) => onChange({ email: v })}
            placeholder="contact@yourlab.in"
            required
            icon={<Mail size={16} />}
            type="email"
          />
        </TwoColumn>
      </FormSection>

      <FormSection title="Address">
        <Row>
          <TextField
            label="Street address"
            value={value.address}
            onChange={(v) => onChange({ address: v })}
            placeholder="Plot 12, Road 3, Banjara Hills"
            required
            icon={<MapPin size={16} />}
          />
        </Row>
        <TwoColumn>
          <TextField
            label="City"
            value={value.city}
            onChange={(v) => onChange({ city: v })}
            placeholder="Hyderabad"
            required
          />
          <TextField
            label="State"
            value={value.state}
            onChange={(v) => onChange({ state: v })}
            placeholder="Telangana"
            required
          />
        </TwoColumn>
        <Row>
          <TextField
            label="Pincode"
            value={value.pincode}
            onChange={(v) => onChange({ pincode: v.replace(/\D/g, '').slice(0, 6) })}
            placeholder="500034"
            required
            helper="6-digit Indian postal code"
            inputMode="numeric"
          />
        </Row>
      </FormSection>

      {/* ── Medium+ only ──────────────────────────────────────────────── */}
      {formExtras.has('gstNumber') && (
        <FormSection title="Business registration">
          <Row>
            <TextField
              label="GSTIN"
              value={value.gstNumber}
              onChange={(v) => onChange({ gstNumber: v.toUpperCase() })}
              placeholder="36AAAAA0000A1Z5"
              required
              helper="15-character GST number. Needed for B2B invoicing."
            />
          </Row>
          {formExtras.has('collectionPoints') && (
            <Row>
              <TextField
                label="Number of collection points"
                value={value.collectionPoints}
                onChange={(v) => onChange({ collectionPoints: v.replace(/\D/g, '') })}
                placeholder="3"
                inputMode="numeric"
                required
                helper="PSCs / pickup points operated under this facility."
              />
            </Row>
          )}
        </FormSection>
      )}

      {/* ── Large+ only ───────────────────────────────────────────────── */}
      {(formExtras.has('nabl') || formExtras.has('branchCount') || formExtras.has('analyserBrands')) && (
        <FormSection title="Scale & accreditation">
          {formExtras.has('nabl') && (
            <Row>
              <TextField
                label="NABL certificate number"
                value={value.nablNumber}
                onChange={(v) => onChange({ nablNumber: v })}
                placeholder="MC-1234"
                helper="If NABL-accredited. Leave blank if not applicable."
                optional
              />
            </Row>
          )}
          {formExtras.has('branchCount') && (
            <Row>
              <TextField
                label="Total branch count"
                value={value.branchCount}
                onChange={(v) => onChange({ branchCount: v.replace(/\D/g, '') })}
                placeholder="8"
                inputMode="numeric"
                required
              />
            </Row>
          )}
          {formExtras.has('analyserBrands') && (
            <Row>
              <TextField
                label="Analyser brands in use"
                value={value.analyserBrands}
                onChange={(v) => onChange({ analyserBrands: v })}
                placeholder="Sysmex XN-1000, Beckman DxC 700 AU"
                helper="Comma-separated. Helps us plan HL7/ASTM interfacing."
                optional
              />
            </Row>
          )}
        </FormSection>
      )}

      {/* ── Enterprise only ───────────────────────────────────────────── */}
      {formExtras.has('groupName') && (
        <FormSection title="Enterprise details">
          <Row>
            <TextField
              label="Group / chain name"
              value={value.groupName}
              onChange={(v) => onChange({ groupName: v })}
              placeholder="Sunrise Healthcare Group"
              required
            />
          </Row>
          <TwoColumn>
            <TextField
              label="Franchise model"
              value={value.isFranchise}
              onChange={(v) => onChange({ isFranchise: v })}
              placeholder="no / yes / hybrid"
              helper="Are branches owned, franchised, or a mix?"
              required
            />
            <TextField
              label="Monthly test volume"
              value={value.monthlyVolume}
              onChange={(v) => onChange({ monthlyVolume: v.replace(/[^0-9,]/g, '') })}
              placeholder="50,000"
              inputMode="numeric"
              required
            />
          </TwoColumn>
          <Row>
            <TextField
              label="Existing software"
              value={value.existingSoftware}
              onChange={(v) => onChange({ existingSoftware: v })}
              placeholder="CrelioHealth / SoftClinic / none"
              helper="Helps us plan data migration if any."
              optional
            />
          </Row>
        </FormSection>
      )}

      <div style={{
        marginTop: 28, padding: 14, borderRadius: 10,
        background: TOKENS.primaryLight,
        border: `1px solid ${TOKENS.primary}30`,
        fontSize: 13, color: TOKENS.text, lineHeight: 1.5,
      }}>
        <strong style={{ color: TOKENS.primaryDark }}>Heads up:</strong>{' '}
        {subtypeSlug === 'ultrasound-center' || subtypeSlug === 'radiology-center' ? (
          <>You'll complete PC-PNDT Form F registration from within your portal after setup — it's mandated by Indian law for any USG work.</>
        ) : subtypeSlug === 'mammography-center' ? (
          <>Mammography requires a licensed female radiographer. You'll add their details from the Staff module after first login.</>
        ) : (
          <>Some subtype-specific compliance documents (AERB licences, biosafety certificates, etc.) are requested from inside your portal after setup — not during registration.</>
        )}
      </div>
    </div>
  );
}

/* ── Layout primitives ─────────────────────────────────────────────────── */

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h3 style={{
        fontSize: 13, fontWeight: 700, color: TOKENS.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        margin: '0 0 14px', paddingBottom: 8,
        borderBottom: `1px solid ${TOKENS.border}`,
      }}>{title}</h3>
      <div style={{ display: 'grid', gap: 14 }}>{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function TwoColumn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
      {children}
    </div>
  );
}
