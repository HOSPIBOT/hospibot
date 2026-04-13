'use client';

import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Upload, FileText, CheckCircle2, XCircle, Loader2,
  ArrowLeft, AlertTriangle, Download, Users,
} from 'lucide-react';

interface ImportRow {
  firstName: string; lastName?: string; phone: string; email?: string;
  dateOfBirth?: string; gender?: string; bloodGroup?: string;
  address?: string; city?: string; allergies?: string;
  _valid: boolean; _error?: string; _imported?: boolean;
}

const REQUIRED_COLS = ['firstName', 'phone'];
const OPTIONAL_COLS = ['lastName', 'email', 'dateOfBirth', 'gender', 'bloodGroup', 'address', 'city', 'allergies'];
const ALL_COLS = [...REQUIRED_COLS, ...OPTIONAL_COLS];

const SAMPLE_CSV = `firstName,lastName,phone,email,dateOfBirth,gender,bloodGroup,address,city,allergies
Ramesh,Kumar,+919876543210,ramesh@email.com,1985-03-15,MALE,O+,"123 MG Road, Banjara Hills",Hyderabad,Penicillin
Priya,Sharma,+919876543211,priya@email.com,1992-07-22,FEMALE,B+,"456 Jubilee Hills",Hyderabad,
Sunita,Reddy,+919876543212,,1978-11-08,FEMALE,A+,,Secunderabad,Aspirin`;

function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').trim());
  const colMap: Record<string, number> = {};
  for (const col of ALL_COLS) {
    const idx = headers.findIndex(h => h.toLowerCase().replace(/[\s_-]/g, '') === col.toLowerCase());
    if (idx !== -1) colMap[col] = idx;
  }

  return lines.slice(1).map((line, rowIdx) => {
    // Handle quoted fields with commas
    const cols: string[] = [];
    let current = ''; let inQuote = false;
    for (const char of line) {
      if (char === '"') { inQuote = !inQuote; }
      else if (char === ',' && !inQuote) { cols.push(current.trim()); current = ''; }
      else { current += char; }
    }
    cols.push(current.trim());

    const get = (col: string) => colMap[col] !== undefined ? (cols[colMap[col]] || '').replace(/^"|"$/g, '').trim() : '';

    const row: ImportRow = {
      firstName: get('firstName'),
      lastName:  get('lastName') || undefined,
      phone:     get('phone'),
      email:     get('email') || undefined,
      dateOfBirth: get('dateOfBirth') || undefined,
      gender:    get('gender') || undefined,
      bloodGroup: get('bloodGroup') || undefined,
      address:   get('address') || undefined,
      city:      get('city') || undefined,
      allergies: get('allergies') || undefined,
      _valid: true,
    };

    // Validate
    if (!row.firstName) { row._valid = false; row._error = 'Missing first name'; }
    else if (!row.phone) { row._valid = false; row._error = 'Missing phone'; }
    else if (!/^[+\d\s()-]{8,}$/.test(row.phone)) { row._valid = false; row._error = 'Invalid phone format'; }

    return row;
  });
}

export default function PatientImportPage() {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [rows, setRows]           = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [done, setDone]           = useState(false);
  const [fileName, setFileName]   = useState('');

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setDone(false);
      setProgress(0);
      if (parsed.length === 0) toast.error('No valid rows found in file');
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) handleFile(file);
    else toast.error('Please upload a .csv file');
  }, [handleFile]);

  const importAll = async () => {
    const valid = rows.filter(r => r._valid && !r._imported);
    if (valid.length === 0) { toast.error('No valid rows to import'); return; }

    setImporting(true);
    let imported = 0, failed = 0;

    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        await api.post('/patients', {
          firstName:   row.firstName,
          lastName:    row.lastName,
          phone:       row.phone.replace(/\s/g, ''),
          email:       row.email,
          dateOfBirth: row.dateOfBirth,
          gender:      row.gender?.toUpperCase(),
          bloodGroup:  row.bloodGroup,
          address:     row.address,
          city:        row.city,
          allergies:   row.allergies ? row.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
        });
        // Mark as imported in UI
        setRows(prev => prev.map(r => r.phone === row.phone ? { ...r, _imported: true } : r));
        imported++;
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed';
        setRows(prev => prev.map(r => r.phone === row.phone ? { ...r, _valid: false, _error: msg } : r));
        failed++;
      }
      setProgress(Math.round(((i + 1) / valid.length) * 100));
      // Small delay to avoid rate limiting
      if (i % 5 === 4) await new Promise(r => setTimeout(r, 200));
    }

    setImporting(false);
    setDone(true);
    toast.success(`Import complete: ${imported} added${failed > 0 ? `, ${failed} failed` : ''}`);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'hospibot-patient-import-template.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  const valid   = rows.filter(r => r._valid);
  const invalid = rows.filter(r => !r._valid);
  const imported = rows.filter(r => r._imported);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/clinical/patients" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Patients</h1>
          <p className="text-sm text-slate-500 mt-0.5">Bulk-import patient records from a CSV file</p>
        </div>
        <div className="flex-1" />
        <button onClick={downloadSample}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" /> Download Template
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-bold text-[#0D7C66] uppercase tracking-widest">Instructions</p>
        <div className="grid grid-cols-2 gap-x-6 text-xs text-[#0A5E4F]">
          <div className="space-y-1">
            <p>✅ Required columns: <strong>firstName, phone</strong></p>
            <p>📋 Optional: lastName, email, dateOfBirth, gender, bloodGroup, address, city, allergies</p>
          </div>
          <div className="space-y-1">
            <p>📅 Date format: <strong>YYYY-MM-DD</strong> (e.g. 1990-03-25)</p>
            <p>📱 Phone: include country code (e.g. +91 98765 43210)</p>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      {rows.length === 0 && (
        <div
          onDrop={onDrop} onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-2xl py-16 text-center cursor-pointer hover:border-[#0D7C66] hover:bg-[#E8F5F0]/30 transition-all">
          <Upload className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Drag & drop your CSV file here</p>
          <p className="text-slate-400 text-sm mt-1">or click to browse</p>
          <p className="text-slate-300 text-xs mt-2">Supports .csv files</p>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Rows',  value: rows.length,    color: '#334155' },
              { label: 'Valid',       value: valid.length,   color: '#10B981' },
              { label: 'Errors',      value: invalid.length, color: '#EF4444' },
              { label: 'Imported',    value: imported.length, color: '#0D7C66' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {importing && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Importing…</span>
                <span className="text-slate-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="h-2 bg-[#0D7C66] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Actions */}
          {!done && (
            <div className="flex items-center gap-3">
              <button onClick={() => { setRows([]); setFileName(''); }}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50">
                <Upload className="w-4 h-4" /> Change File
              </button>
              <button onClick={importAll} disabled={importing || valid.length === 0}
                className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-60 transition-colors">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {importing ? `Importing… ${progress}%` : `Import ${valid.length} Valid Patients`}
              </button>
            </div>
          )}

          {done && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="text-emerald-800 font-semibold text-sm">
                Import complete! {imported.length} patients added successfully.
              </p>
              <a href="/clinical/patients" className="ml-auto text-sm text-emerald-700 underline hover:opacity-80">
                View Patients →
              </a>
            </div>
          )}

          {/* Table preview */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">{fileName}</span>
              <span className="text-xs text-slate-400 ml-auto">{rows.length} rows</span>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide">City</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((row, i) => (
                    <tr key={i} className={`${!row._valid ? 'bg-red-50/50' : row._imported ? 'bg-emerald-50/50' : ''}`}>
                      <td className="px-3 py-2">
                        {row._imported ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : row._valid ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {row.firstName} {row.lastName || ''}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">{row.phone}</td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-32">{row.email || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{row.city || '—'}</td>
                      <td className="px-3 py-2 text-red-500">{row._error || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
