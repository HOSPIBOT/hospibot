'use client';

import { useState } from 'react';
import { Printer, QrCode } from 'lucide-react';

interface BarcodeLabel {
  barcode: string;
  orderNumber: string;
  patientName: string;
  testCodes: string[];
  collectedAt?: string;
  tubeType?: string;
  labName?: string;
}

// Generates a simple barcode-like visual using CSS bars
function BarcodeSvg({ value }: { value: string }) {
  // Simple hash to generate bar pattern
  const bars: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bars.push(code & 1 ? 3 : 1);
    bars.push(code & 2 ? 2 : 1);
    bars.push(code & 4 ? 3 : 2);
    bars.push(1);
  }
  const totalWidth = bars.reduce((s, b) => s + b, 0);
  const scale = 80 / totalWidth;

  let x = 0;
  return (
    <svg width={80} height={32} viewBox={`0 0 80 32`}>
      {bars.map((w, i) => {
        const rx = x * scale;
        x += w;
        return i % 2 === 0 ? (
          <rect key={i} x={rx} y={0} width={w * scale * 0.9} height={28} fill="#000" />
        ) : null;
      })}
    </svg>
  );
}

function LabelContent({ label }: { label: BarcodeLabel }) {
  const date = label.collectedAt
    ? new Date(label.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

  return (
    <div style={{
      width: '76mm', height: '32mm', border: '1px solid #000',
      padding: '2mm', fontFamily: 'monospace', fontSize: '7pt',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      background: 'white', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>
            {label.patientName.slice(0, 20)}
          </div>
          <div style={{ color: '#333' }}>{label.orderNumber}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '6pt', color: '#555' }}>
          <div>{date}</div>
          {label.tubeType && <div>{label.tubeType}</div>}
        </div>
      </div>

      {/* Barcode */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BarcodeSvg value={label.barcode} />
        <div style={{ fontSize: '7pt', letterSpacing: '1px', marginTop: '1px' }}>
          {label.barcode}
        </div>
      </div>

      {/* Tests */}
      <div style={{ fontSize: '6pt', color: '#333', borderTop: '0.5px solid #ccc', paddingTop: '1mm' }}>
        {label.testCodes.slice(0, 6).join(' · ')}
        {label.testCodes.length > 6 && ` +${label.testCodes.length - 6}`}
      </div>
    </div>
  );
}

interface BarcodePrintProps {
  labels: BarcodeLabel[];
}

export function BarcodePrint({ labels }: BarcodePrintProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    // Create hidden iframe for print-only content
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    document.body.appendChild(iframe);

    const labelsHtml = labels.map(label => {
      const date = label.collectedAt
        ? new Date(label.collectedAt).toLocaleDateString('en-IN')
        : new Date().toLocaleDateString('en-IN');
      return `
        <div class="label">
          <div class="header">
            <div class="patient">${label.patientName.slice(0, 22)}</div>
            <div class="order">${label.orderNumber} &nbsp;|&nbsp; ${date}</div>
          </div>
          <div class="barcode-text">${label.barcode}</div>
          <div class="barcode-bars">${generateBarsHtml(label.barcode)}</div>
          <div class="tests">${label.testCodes.slice(0, 5).join(' · ')}</div>
          ${label.tubeType ? `<div class="tube">${label.tubeType}</div>` : ''}
        </div>`;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: 76mm 32mm; margin: 0; }
          body { margin: 0; padding: 0; font-family: monospace; }
          .label {
            width: 72mm; height: 28mm; border: 0.5pt solid #000;
            padding: 2mm; box-sizing: border-box;
            page-break-after: always; display: flex; flex-direction: column;
            justify-content: space-between;
          }
          .header { display: flex; justify-content: space-between; }
          .patient { font-weight: bold; font-size: 8pt; }
          .order { font-size: 6pt; color: #333; }
          .barcode-bars { display: flex; gap: 0; height: 12mm; align-items: flex-end; }
          .bar { background: #000; }
          .barcode-text { font-size: 7pt; letter-spacing: 1px; text-align: center; }
          .tests { font-size: 6pt; color: #444; border-top: 0.5pt solid #ccc; padding-top: 0.5mm; }
          .tube { font-size: 6pt; color: #666; font-weight: bold; }
        </style>
      </head>
      <body>${labelsHtml}</body>
      </html>
    `;

    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();

    setTimeout(() => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      document.body.removeChild(iframe);
      setPrinting(false);
    }, 500);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={printing || labels.length === 0}
      className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
    >
      <Printer className="w-4 h-4" />
      {printing ? 'Printing…' : `Print ${labels.length} Label${labels.length !== 1 ? 's' : ''}`}
    </button>
  );
}

// Generate simple bar HTML from barcode string
function generateBarsHtml(value: string): string {
  const bars: { width: number; fill: boolean }[] = [];
  for (let i = 0; i < Math.min(value.length, 12); i++) {
    const code = value.charCodeAt(i);
    bars.push({ width: (code & 1) ? 2 : 1, fill: true });
    bars.push({ width: 1, fill: false });
    bars.push({ width: (code & 4) ? 3 : 1, fill: true });
    bars.push({ width: 1, fill: false });
  }
  return bars
    .map(b => `<div class="bar" style="width:${b.width}px;height:${b.fill ? '12mm' : '0'};background:${b.fill ? '#000' : 'transparent'}"></div>`)
    .join('');
}

// Convenience component for single label
export function SingleBarcodeButton({ label }: { label: BarcodeLabel }) {
  return <BarcodePrint labels={[label]} />;
}
