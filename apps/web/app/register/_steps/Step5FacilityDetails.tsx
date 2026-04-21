'use client';

import { Building2, Phone, Mail, MapPin, FileText, Layers, Award, Globe } from 'lucide-react';
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

export default function Step5FacilityDetails({ tier, subtypeSlug, value, onChange }: Props) {
  const tierConfig = tier ? DIAGNOSTIC_TIERS.find((t) => t.id === tier) : null;
  const formExtras = new Set(tierConfig?.formExtras ?? []);

  const handleNameChange = (name: string) => {
    const patch: Partial<WizardState['facility']> = { name };
    if (!value.slug) {
      patch.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    }
    onChange(patch);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${TOKENS.primary}, #14B88C)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 8px 24px ${TOKENS.primary}30` }}>
          <Building2 size={26} color="#fff" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TOKENS.navy, marginBottom: 6 }}>Tell us about your facility</h1>
        <p style={{ fontSize: 14, color: TOKENS.textMuted, maxWidth: 440, margin: '0 auto' }}>These details go into your portal header, reports, and invoices. You can update them anytime from Settings.</p>
      </div>

      {/* Basic Information Card */}
      <FormCard icon={<Building2 size={18} color={TOKENS.primary} />} title="Basic information" step="1" total={formExtras.has('groupName') ? '4' : formExtras.has('gstNumber') ? '3' : '2'}>
        <Row>
          <TextField label="Lab / facility name" value={value.name} onChange={handleNameChange} placeholder="e.g. Sunrise Diagnostics" required icon={<Building2 size={16} />} />
        </Row>
        <Row>
          <TextField label="URL slug" value={value.slug} onChange={(v) => onChange({ slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="sunrise-diagnostics" required helper="Used in your portal URL. Lowercase letters, numbers and hyphens only." />
        </Row>
        <TwoColumn>
          <TextField label="Primary phone" value={value.phone} onChange={(v) => onChange({ phone: v })} placeholder="98765 43210" prefix="+91" required icon={<Phone size={16} />} type="tel" />
          <TextField label="Primary email" value={value.email} onChange={(v) => onChange({ email: v })} placeholder="contact@yourlab.in" required icon={<Mail size={16} />} type="email" />
        </TwoColumn>
      </FormCard>

      {/* Address Card */}
      <FormCard icon={<MapPin size={18} color={TOKENS.primary} />} title="Address" step="2" total={formExtras.has('groupName') ? '4' : formExtras.has('gstNumber') ? '3' : '2'}>
        <Row>
          <TextField label="Street address" value={value.address} onChange={(v) => onChange({ address: v })} placeholder="Plot 12, Road 3, Banjara Hills" required icon={<MapPin size={16} />} />
        </Row>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 14 }}>
          <TextField label="City" value={value.city} onChange={(v) => onChange({ city: v })} placeholder="Hyderabad" required />
          <TextField label="State" value={value.state} onChange={(v) => onChange({ state: v })} placeholder="Telangana" required />
          <TextField label="Pincode" value={value.pincode} onChange={(v) => onChange({ pincode: v.replace(/\D/g, '').slice(0, 6) })} placeholder="500034" required inputMode="numeric" />
        </div>
      </FormCard>

      {/* Business Registration (Medium+) */}
      {formExtras.has('gstNumber') && (
        <FormCard icon={<FileText size={18} color={TOKENS.primary} />} title="Business registration" step="3" total={formExtras.has('groupName') ? '4' : '3'}>
          <Row>
            <TextField label="GSTIN" value={value.gstNumber} onChange={(v) => onChange({ gstNumber: v.toUpperCase() })} placeholder="36AAAAA0000A1Z5" required helper="15-character GST number. Needed for B2B invoicing." />
          </Row>
          {formExtras.has('collectionPoints') && (
            <Row>
              <TextField label="Number of collection points" value={value.collectionPoints} onChange={(v) => onChange({ collectionPoints: v.replace(/\D/g, '') })} placeholder="3" inputMode="numeric" required helper="PSCs / pickup points operated under this facility." />
            </Row>
          )}
          {formExtras.has('nabl') && (
            <Row>
              <TextField label="NABL certificate number" value={value.nablNumber} onChange={(v) => onChange({ nablNumber: v })} placeholder="MC-1234" helper="If NABL-accredited. Leave blank if not applicable." optional />
            </Row>
          )}
          {formExtras.has('branchCount') && (
            <TwoColumn>
              <TextField label="Total branch count" value={value.branchCount} onChange={(v) => onChange({ branchCount: v.replace(/\D/g, '') })} placeholder="8" inputMode="numeric" required />
              {formExtras.has('analyserBrands') && (
                <TextField label="Analyser brands in use" value={value.analyserBrands} onChange={(v) => onChange({ analyserBrands: v })} placeholder="Sysmex, Beckman" helper="Helps plan HL7/ASTM interfacing." optional />
              )}
            </TwoColumn>
          )}
        </FormCard>
      )}

      {/* Enterprise Details */}
      {formExtras.has('groupName') && (
        <FormCard icon={<Globe size={18} color={TOKENS.primary} />} title="Enterprise details" step="4" total="4">
          <Row>
            <TextField label="Group / chain name" value={value.groupName} onChange={(v) => onChange({ groupName: v })} placeholder="Sunrise Healthcare Group" required />
          </Row>
          <TwoColumn>
            <TextField label="Franchise model" value={value.isFranchise} onChange={(v) => onChange({ isFranchise: v })} placeholder="no / yes / hybrid" helper="Owned, franchised, or mixed?" required />
            <TextField label="Monthly test volume" value={value.monthlyVolume} onChange={(v) => onChange({ monthlyVolume: v.replace(/[^0-9,]/g, '') })} placeholder="50,000" inputMode="numeric" required />
          </TwoColumn>
          <Row>
            <TextField label="Existing software" value={value.existingSoftware} onChange={(v) => onChange({ existingSoftware: v })} placeholder="CrelioHealth / SoftClinic / none" helper="Helps plan data migration." optional />
          </Row>
        </FormCard>
      )}

      {/* Compliance Notice */}
      <div style={{
        marginTop: 8, padding: '16px 20px', borderRadius: 14,
        background: `linear-gradient(135deg, ${TOKENS.primary}08, ${TOKENS.primary}04)`,
        border: `1px solid ${TOKENS.primary}20`,
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${TOKENS.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Award size={18} color={TOKENS.primary} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.primaryDark, marginBottom: 4 }}>Compliance note</div>
          <div style={{ fontSize: 12, color: TOKENS.textMuted, lineHeight: 1.6 }}>
            {subtypeSlug === 'ultrasound-center' || subtypeSlug === 'radiology-center'
              ? 'PC-PNDT Form F registration is completed from within your portal after setup — mandated by Indian law for USG work.'
              : subtypeSlug === 'mammography-center'
              ? 'Mammography requires a licensed female radiographer. Add their details from the Staff module after first login.'
              : 'Subtype-specific compliance documents (AERB licences, biosafety certificates, etc.) are collected inside your portal after setup.'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Layout primitives ─────────────────────────────────────────────────── */

function FormCard({ icon, title, step, total, children }: { icon: React.ReactNode; title: string; step: string; total: string; children: React.ReactNode }) {
  return (
    <section style={{
      marginBottom: 20, borderRadius: 18,
      background: '#fff',
      border: '1.5px solid #E2E8F0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 22px',
        background: `linear-gradient(135deg, ${TOKENS.navy}, ${TOKENS.navyLight})`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: -0.2 }}>{title}</span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{step} / {total}</span>
      </div>
      <div style={{ padding: '22px 22px 24px', display: 'grid', gap: 16 }}>{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function TwoColumn({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>{children}</div>;
}
