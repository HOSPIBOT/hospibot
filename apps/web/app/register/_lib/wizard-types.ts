/**
 * Registration wizard — shared types, tokens, constants.
 *
 * Brand tokens are locked per product memory — do not drift. The WhatsApp
 * green (#25D366) is reserved for WhatsApp UI, not for registration.
 */

export const TOKENS = {
  primary:     '#0D7C66',  // Deep Teal
  primaryDark: '#0A5E4F',
  primaryLight:'#E8F5F0',
  accent:      '#F59E0B',  // Warm Amber
  text:        '#1E293B',  // Slate
  textMuted:   '#64748B',
  surface:     '#F8FAFC',
  border:      '#E2E8F0',
  borderStrong:'#CBD5E1',
  success:     '#10B981',
  danger:      '#DC2626',
} as const;

export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const STEP_LABELS: Record<StepId, string> = {
  1: 'Welcome',
  2: 'Pick a category',
  3: 'Pick your subtype',
  4: 'Pick your size',
  5: 'Facility details',
  6: 'Create your account',
  7: 'All set',
};

export const TOTAL_STEPS: StepId = 7;

/** Shape of the wizard's in-memory state — mirrors RegistrationDraft on the server. */
export interface WizardState {
  /** Draft token from the server — present once the user advances past step 1 */
  draftToken: string | null;
  currentStep: StepId;
  portalFamily: string;            // 'diagnostic' only for now — extensible
  groupSlug: string | null;        // e.g. 'imaging'
  subtypeSlug: string | null;      // e.g. 'ultrasound-center'
  tierKey: 'small' | 'medium' | 'large' | 'enterprise' | null;
  billingCycle: 'monthly' | 'annual';
  facility: {
    name: string;
    slug: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstNumber: string;
    nablNumber: string;
    collectionPoints: string;
    branchCount: string;
    analyserBrands: string;
    groupName: string;
    isFranchise: string;
    existingSoftware: string;
    monthlyVolume: string;
  };
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  };
}

export const emptyWizardState: WizardState = {
  draftToken: null,
  currentStep: 1,
  portalFamily: 'diagnostic',
  groupSlug: null,
  subtypeSlug: null,
  tierKey: null,
  billingCycle: 'annual',
  facility: {
    name: '', slug: '', phone: '', email: '', address: '', city: '', state: '',
    pincode: '', gstNumber: '', nablNumber: '', collectionPoints: '',
    branchCount: '', analyserBrands: '', groupName: '', isFranchise: '',
    existingSoftware: '', monthlyVolume: '',
  },
  admin: { firstName: '', lastName: '', email: '', phone: '', password: '' },
};
