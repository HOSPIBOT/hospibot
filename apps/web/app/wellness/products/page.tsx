'use client';
import { MessageSquare } from 'lucide-react';
export default function Page() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Wellness Products</h1>
      <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{background:'#BE185D15'}}>
          <MessageSquare className="w-8 h-8" style={{color:'#BE185D'}}/>
        </div>
        <p className="text-slate-400 text-sm font-medium">Wellness Products</p>
        <p className="text-slate-300 text-xs mt-1">Full functionality coming in next update</p>
      </div>
    </div>
  );
}
