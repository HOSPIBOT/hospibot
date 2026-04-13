'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  CreditCard, CheckCircle2, Zap, Users, Building2,
  RefreshCw, ExternalLink, AlertTriangle, IndianRupee,
  Shield, Sparkles,
} from 'lucide-react';

const PLAN_COLORS: Record<string, string> = {
  STARTER:      '#64748B',
  GROWTH:       '#0D7C66',
  PROFESSIONAL: '#3B82F6',
  ENTERPRISE:   '#8B5CF6',
};

const PLAN_FEATURES: Record<string, string[]> = {
  STARTER:      ['Up to 5 users', '1 branch', 'WhatsApp Inbox', 'Appointments', 'Basic Billing', 'Patient Records'],
  GROWTH:       ['Up to 15 users', '2 branches', 'All Starter +', 'CRM & Lead Mgmt', 'Automation Engine', 'Lab Module'],
  PROFESSIONAL: ['Up to 50 users', '5 branches', 'All Growth +', 'Pharmacy Module', 'Bed Management', 'FHIR R4 API'],
  ENTERPRISE:   ['Unlimited users', 'Unlimited branches', 'All Professional +', 'Custom integrations', 'ABDM HIE', 'Dedicated support'],
};

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans,        setPlans]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [upgrading,    setUpgrading]    = useState('');
  const [cancelling,   setCancelling]   = useState(false);
  const [showConfirm,  setShowConfirm]  = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/subscriptions/current'),
      api.get('/subscriptions/plans'),
    ]).then(([subRes, planRes]) => {
      setSubscription(subRes.data);
      setPlans(planRes.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const upgrade = async (planName: string) => {
    setUpgrading(planName);
    try {
      const res = await api.post('/subscriptions/payment-link', {
        plan:      planName,
        returnUrl: window.location.href,
      });
      if (res.data?.isDemoMode) {
        toast.success(res.data.message || 'Demo mode — payment link generated');
        setSubscription((s: any) => ({ ...s, plan: planName, status: 'ACTIVE' }));
      } else if (res.data?.url) {
        toast.success('Redirecting to Razorpay payment…');
        window.open(res.data.url, '_blank');
      }
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to generate payment link'); }
    finally { setUpgrading(''); }
  };

  const cancel = async () => {
    setCancelling(true);
    try {
      await api.post('/subscriptions/cancel');
      toast.success('Subscription will be cancelled at end of billing period');
      setSubscription((s: any) => ({ ...s, status: 'CANCELLED' }));
      setShowConfirm('');
    } catch { toast.error('Failed to cancel'); }
    finally { setCancelling(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 text-[#0D7C66] animate-spin" />
    </div>
  );

  const currentPlan = subscription?.plan || 'FREE';
  const isActive    = subscription?.status === 'ACTIVE';

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[#0D7C66]" /> Subscription & Billing
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your HospiBot subscription · Powered by Razorpay</p>
      </div>

      {/* Current subscription card */}
      <div className="bg-gradient-to-r from-[#0D7C66] to-[#0A5E4F] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">Current Plan</p>
            <p className="text-3xl font-black mt-1">{currentPlan}</p>
            <p className="text-white/70 text-sm mt-1">{subscription?.priceFormatted || 'Free'}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-red-500/30 text-red-200'}`}>
              {subscription?.status || 'INACTIVE'}
            </span>
            {subscription?.currentPeriodEnd && (
              <p className="text-white/60 text-xs mt-2">
                Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Razorpay subscription ID */}
        {subscription?.razorpaySubscriptionId && (
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5 text-white/80" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Razorpay Subscription ID</p>
              <p className="text-white/90 text-xs font-mono">{subscription.razorpaySubscriptionId}</p>
            </div>
          </div>
        )}

        {subscription?.status === 'CANCELLED' && (
          <div className="mt-4 flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-2.5 text-sm text-amber-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Subscription cancelled — access continues until end of current period
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-4 gap-4">
        {plans.map(plan => {
          const isCurrent = plan.name === currentPlan;
          const color     = PLAN_COLORS[plan.name] || '#64748B';
          const features  = PLAN_FEATURES[plan.name] || [];
          return (
            <div key={plan.name}
              className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${isCurrent ? 'border-[#0D7C66] shadow-lg shadow-[#0D7C66]/10' : 'border-slate-100 hover:border-slate-200'}`}>
              {isCurrent && (
                <div className="bg-[#0D7C66] text-white text-center text-xs font-bold py-1.5 tracking-wide">
                  CURRENT PLAN
                </div>
              )}
              {plan.name === 'PROFESSIONAL' && !isCurrent && (
                <div className="text-center text-xs font-bold py-1.5 tracking-wide" style={{background:`${color}15`,color}}>
                  ✨ MOST POPULAR
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-black text-slate-900">{plan.name}</p>
                  <Zap className="w-4 h-4" style={{color}} />
                </div>
                <p className="text-xl font-black" style={{color}}>{plan.priceFormatted}</p>

                <div className="mt-4 space-y-2">
                  {features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{color}} />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> {plan.maxUsers} users</div>
                  <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> {plan.maxBranches} branch{plan.maxBranches!=='1'?'es':''}</div>
                </div>

                {!isCurrent ? (
                  <button onClick={() => setShowConfirm(plan.name)} disabled={!!upgrading}
                    className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{background: color}}>
                    {upgrading === plan.name ? 'Processing…' : 'Upgrade →'}
                  </button>
                ) : (
                  <div className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-center" style={{background:`${color}15`, color}}>
                    ✓ Active
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Razorpay info */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-[#0D7C66]"/> Payment Information
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#0D7C66] flex-shrink-0 mt-0.5"/>
            <div><p className="font-semibold text-slate-900">Secure Payments</p><p className="text-xs mt-0.5">All payments processed via Razorpay — India's most trusted payment gateway</p></div>
          </div>
          <div className="flex items-start gap-2">
            <IndianRupee className="w-4 h-4 text-[#0D7C66] flex-shrink-0 mt-0.5"/>
            <div><p className="font-semibold text-slate-900">Payment Methods</p><p className="text-xs mt-0.5">UPI, Net Banking, Credit/Debit Cards, Wallets — all supported</p></div>
          </div>
          <div className="flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-[#0D7C66] flex-shrink-0 mt-0.5"/>
            <div><p className="font-semibold text-slate-900">Auto-Renewal</p><p className="text-xs mt-0.5">Subscription renews monthly. Cancel anytime from this page.</p></div>
          </div>
        </div>
      </div>

      {/* Cancel */}
      {isActive && currentPlan !== 'FREE' && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5">
          <div>
            <p className="font-semibold text-slate-900">Cancel Subscription</p>
            <p className="text-sm text-slate-500 mt-0.5">Your plan will remain active until the end of the current billing period</p>
          </div>
          <button onClick={() => setShowConfirm('CANCEL')}
            className="text-sm font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowConfirm('')}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            {showConfirm === 'CANCEL' ? (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Cancel Subscription?</h2>
                <p className="text-sm text-slate-500 mb-6">You'll retain access until the end of your current billing period. After that, your account will be downgraded to Free plan.</p>
                <div className="flex items-center gap-3">
                  <button onClick={()=>setShowConfirm('')} className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50">Keep Plan</button>
                  <button onClick={cancel} disabled={cancelling} className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50">
                    {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Upgrade to {showConfirm}?</h2>
                <p className="text-sm text-slate-500 mb-2">You'll be redirected to Razorpay to complete payment.</p>
                <div className="bg-slate-50 rounded-xl p-3 mb-5 text-sm">
                  <p className="font-semibold text-slate-900">{showConfirm} Plan</p>
                  <p className="text-slate-500">{plans.find(p=>p.name===showConfirm)?.priceFormatted}</p>
                  <p className="text-xs text-slate-400 mt-1">Pay via UPI, Net Banking, or Card</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={()=>setShowConfirm('')} className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
                  <button onClick={()=>{upgrade(showConfirm);setShowConfirm('');}} disabled={!!upgrading}
                    className="flex-1 py-2.5 bg-[#0D7C66] text-white font-semibold rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 flex items-center justify-center gap-2">
                    <IndianRupee className="w-4 h-4"/> Pay via Razorpay
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
