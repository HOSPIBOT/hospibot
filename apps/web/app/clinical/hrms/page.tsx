'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  IndianRupee, Users, RefreshCw, Download, Plus,
  ChevronLeft, ChevronRight, CheckCircle2, Clock,
  TrendingUp, Calculator,
} from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

interface PayrollRecord {
  userId: string;
  name: string;
  role: string;
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  overtime: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
}

export default function HRMSPayrollPage() {
  const [staff,     setStaff]     = useState<any[]>([]);
  const [payroll,   setPayroll]   = useState<PayrollRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [processing,setProcessing]= useState(false);
  const [exporting, setExporting] = useState(false);
  const [month,     setMonth]     = useState(new Date().getMonth());
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [editRow,   setEditRow]   = useState<string|null>(null);
  const [editData,  setEditData]  = useState<any>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/security/users', { params: { limit: 100 } });
      const users = (res.data.data ?? res.data ?? []).filter((u:any) => u.role !== 'PATIENT');
      setStaff(users);
      // Build payroll records with default salary structure
      const records: PayrollRecord[] = users.map((u: any) => {
        const baseSalary = SALARY_BY_ROLE[u.role] ?? 25000;
        const workingDays = new Date(year, month+1, 0).getDate();
        const presentDays = workingDays; // default full attendance
        const earned = Math.round(baseSalary * (presentDays / workingDays));
        const deductions = Math.round(earned * 0.12); // 12% PF
        return {
          userId: u.id,
          name: `${u.firstName||''} ${u.lastName||''}`.trim(),
          role: u.role?.replace(/_/g,' ') || '',
          baseSalary,
          workingDays,
          presentDays,
          overtime: 0,
          deductions,
          bonus: 0,
          netSalary: earned - deductions,
          status: 'PENDING',
        };
      });
      setPayroll(records);
    } catch { setStaff([]); setPayroll([]); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const SALARY_BY_ROLE: Record<string,number> = {
    SUPER_ADMIN: 150000, TENANT_ADMIN: 80000, BRANCH_ADMIN: 60000,
    DOCTOR: 120000, RECEPTIONIST: 25000, BILLING_STAFF: 28000,
    NURSE: 35000, LAB_TECHNICIAN: 32000, PHARMACIST: 40000,
    MARKETING_USER: 30000,
  };

  const updateRow = (userId: string, field: string, value: number) => {
    setPayroll(p => p.map((r: any) => {
      if (r.userId !== userId) return r;
      const updated = { ...r, [field]: value };
      const earned = Math.round(updated.baseSalary * (updated.presentDays / updated.workingDays));
      updated.netSalary = earned + updated.overtime + updated.bonus - updated.deductions;
      return updated;
    }));
  };

  const processAll = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    setPayroll(p => p.map((r: any) => ({ ...r, status: 'PROCESSED' })));
    toast.success(`Payroll processed for ${payroll.length} employees — ${MONTHS[month]} ${year}`);
    setProcessing(false);
  };

  const markPaid = (userId: string) => {
    setPayroll(p => p.map((r: any) => r.userId===userId ? {...r,status:'PAID'} : r));
    toast.success('Marked as paid');
  };

  const exportCSV = () => {
    setExporting(true);
    const header = ['Employee','Role','Base Salary','Working Days','Present Days','Overtime','Deductions','Bonus','Net Salary','Status'];
    const rows = payroll.map((r: any) => [
      r.name, r.role, r.baseSalary, r.workingDays, r.presentDays,
      r.overtime, r.deductions, r.bonus, r.netSalary, r.status,
    ]);
    const csv=[header,...rows].map((r: any) =>r.map((v: any) =>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`payroll-${MONTHS[month]}-${year}.csv`;
    a.click();URL.revokeObjectURL(url);toast.success('Payroll exported');
    setExporting(false);
  };

  const totalPayable   = payroll.reduce((s: number, r: any) => s + r.netSalary, 0);
  const totalDeductions= payroll.reduce((s: number, r: any) => s + r.deductions, 0);
  const totalBonus     = payroll.reduce((s: number, r: any) => s + r.bonus, 0);
  const pendingCount   = payroll.filter((r: any) => r.status==='PENDING').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-[#0D7C66]" /> Payroll Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{MONTHS[month]} {year} · {payroll.length} employees</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e=>setMonth(+e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none">
            {MONTHS.map((m,i)=><option key={m} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(+e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none">
            {[2024,2025,2026].map((y: any) =><option key={y}>{y}</option>)}
          </select>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            <Download className="w-4 h-4"/> {exporting?'…':'Export'}
          </button>
          <button onClick={processAll} disabled={processing||pendingCount===0}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50">
            {processing?<RefreshCw className="w-4 h-4 animate-spin"/>:<Calculator className="w-4 h-4"/>}
            Process Payroll
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:'Total Payable',    value: formatINR(totalPayable*100),    color:'#0D7C66'},
          {label:'Total Deductions', value: formatINR(totalDeductions*100), color:'#EF4444'},
          {label:'Total Bonus',      value: formatINR(totalBonus*100),      color:'#F59E0B'},
          {label:'Pending',          value: pendingCount,                   color:'#3B82F6'},
        ].map((k: any) =>(
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="text-2xl font-bold mt-1" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Payroll table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Employee Payroll — {MONTHS[month]} {year}</h3>
          <p className="text-xs text-slate-400">Click cells to edit. Deductions default to 12% PF.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead><tr className="border-b border-slate-100">
              {['Employee','Role','Base (₹)','Days','Present','Overtime (₹)','Deductions (₹)','Bonus (₹)','Net (₹)','Status',''].map((h: any) =>(
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i}>{Array.from({length:11}).map((__,j)=><td key={j} className="px-3 py-3"><div className="animate-pulse bg-slate-200 rounded h-4"/></td>)}</tr>
              )) : payroll.length===0 ? (
                <tr><td colSpan={11} className="py-16 text-center text-slate-400 text-sm">No staff found</td></tr>
              ) : payroll.map((r: any) => (
                <tr key={r.userId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0D7C66] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{r.name[0]||'?'}</div>
                      <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{r.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{r.role}</td>
                  <td className="px-3 py-3">
                    <input type="number" className="w-24 text-sm font-semibold text-slate-900 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-[#0D7C66] py-0.5"
                      value={r.baseSalary} onChange={e=>updateRow(r.userId,'baseSalary',+e.target.value)} />
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600 text-center">{r.workingDays}</td>
                  <td className="px-3 py-3">
                    <input type="number" min={0} max={r.workingDays} className="w-12 text-sm text-center font-semibold text-slate-900 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-[#0D7C66] py-0.5"
                      value={r.presentDays} onChange={e=>updateRow(r.userId,'presentDays',Math.min(r.workingDays,+e.target.value))} />
                  </td>
                  <td className="px-3 py-3">
                    <input type="number" min={0} className="w-20 text-sm text-slate-700 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-[#0D7C66] py-0.5"
                      value={r.overtime} onChange={e=>updateRow(r.userId,'overtime',+e.target.value)} />
                  </td>
                  <td className="px-3 py-3">
                    <input type="number" min={0} className="w-20 text-sm text-red-600 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-[#0D7C66] py-0.5"
                      value={r.deductions} onChange={e=>updateRow(r.userId,'deductions',+e.target.value)} />
                  </td>
                  <td className="px-3 py-3">
                    <input type="number" min={0} className="w-20 text-sm text-amber-600 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-[#0D7C66] py-0.5"
                      value={r.bonus} onChange={e=>updateRow(r.userId,'bonus',+e.target.value)} />
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-[#0D7C66] whitespace-nowrap">₹{r.netSalary.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      r.status==='PAID'?'bg-emerald-100 text-emerald-700':r.status==='PROCESSED'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    {r.status==='PROCESSED' && (
                      <button onClick={()=>markPaid(r.userId)} className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100">
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payroll.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-xs text-slate-500">{payroll.filter((r: any) =>r.status==='PAID').length} paid · {payroll.filter((r: any) =>r.status==='PROCESSED').length} processed · {pendingCount} pending</p>
            <p className="text-sm font-bold text-[#0D7C66]">Total Payable: {formatINR(totalPayable*100)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
