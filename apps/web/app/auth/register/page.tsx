'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const tenantTypes = [
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'DOCTOR', label: 'Individual Doctor' },
  { value: 'DIAGNOSTIC_CENTER', label: 'Diagnostic Center' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'IVF_CENTER', label: 'IVF Center' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', slug: '', type: 'HOSPITAL', phone: '', city: '', state: '',
    adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '',
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      setAuth(res.data.user, res.data.tenant, res.data.accessToken, res.data.refreshToken);
      toast.success('Registration successful! Welcome to HospiBot.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, val: string) => setForm({ ...form, [key]: val });

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-primary-600 flex-col justify-center items-center p-12">
        <div className="max-w-sm text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-4">HospiBot</h1>
          <p className="text-primary-100 text-lg">Set up your healthcare operations in under 2 minutes</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-6 text-center">
            <h1 className="text-3xl font-display font-bold text-primary-600">HospiBot</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Register your organization</h2>
          <p className="text-gray-500 text-sm mb-6">Step {step} of 2</p>
          <div className="flex gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-gray-200'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`} />
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization name</label>
                  <input className="input-field" placeholder="City Multi-Specialty Hospital" value={form.name} onChange={e => handleNameChange(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">hospibot.in/</span>
                    <input className="input-field flex-1" value={form.slug} onChange={e => set('slug', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
                    {tenantTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input className="input-field" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input className="input-field" placeholder="Hyderabad" value={form.city} onChange={e => set('city', e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={() => setStep(2)} className="btn-primary w-full py-3 text-sm mt-4">Continue</button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your first name</label>
                    <input className="input-field" placeholder="Vinod" value={form.adminFirstName} onChange={e => set('adminFirstName', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                    <input className="input-field" placeholder="Bysani" value={form.adminLastName} onChange={e => set('adminLastName', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input type="email" className="input-field" placeholder="admin@hospital.com" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" className="input-field" placeholder="Minimum 8 characters" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)} required minLength={8} />
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1 py-3 text-sm">Back</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-sm">
                    {loading ? 'Creating...' : 'Create account'}
                  </button>
                </div>
              </div>
            )}
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-600 font-medium hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
