'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Building, MessageSquare, Users, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [tenantRes, statsRes] = await Promise.all([
          api.get('/tenants/current'),
          api.get('/analytics/dashboard').catch(() => ({ data: {} })),
        ]);
        setTenant({ ...tenantRes.data, stats: statsRes.data });
      } catch { toast.error('Failed to load settings'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Building className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-gray-900">Organization profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-500">Name</p><p className="text-sm font-medium mt-0.5">{tenant?.name}</p></div>
          <div><p className="text-xs text-gray-500">Type</p><p className="text-sm font-medium mt-0.5">{tenant?.type}</p></div>
          <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium mt-0.5">{tenant?.email}</p></div>
          <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium mt-0.5">{tenant?.phone}</p></div>
          <div><p className="text-xs text-gray-500">City</p><p className="text-sm font-medium mt-0.5">{tenant?.city || '-'}</p></div>
          <div><p className="text-xs text-gray-500">Plan</p><p className="text-sm font-medium mt-0.5">{tenant?.plan}</p></div>
          <div><p className="text-xs text-gray-500">Status</p>
            <span className={`badge ${tenant?.status === 'ACTIVE' ? 'badge-success' : tenant?.status === 'TRIAL' ? 'badge-warning' : 'badge-danger'}`}>
              {tenant?.status}
            </span>
          </div>
          {tenant?.gstNumber && <div><p className="text-xs text-gray-500">GST Number</p><p className="text-sm font-medium mt-0.5">{tenant.gstNumber}</p></div>}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-whatsapp" />
          <h3 className="font-semibold text-gray-900">WhatsApp configuration</h3>
        </div>
        {tenant?.waPhoneNumberId ? (
          <div className="space-y-2">
            <div><p className="text-xs text-gray-500">Phone Number ID</p><p className="text-sm font-mono mt-0.5">{tenant.waPhoneNumberId}</p></div>
            <div><p className="text-xs text-gray-500">Business Account ID</p><p className="text-sm font-mono mt-0.5">{tenant.waBusinessId}</p></div>
            <span className="badge badge-success">Connected</span>
          </div>
        ) : (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">WhatsApp not connected yet</p>
            <p className="text-xs text-gray-400 mt-1">Apply for WhatsApp Business API through Meta Business Suite</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Security</h3>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <p>All data is encrypted at rest and in transit using AES-256 encryption.</p>
          <p>Row-Level Security (RLS) ensures complete data isolation between tenants.</p>
          <p>JWT-based authentication with automatic token refresh.</p>
        </div>
      </div>
    </div>
  );
}
