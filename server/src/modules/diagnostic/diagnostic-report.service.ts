import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class DiagnosticReportService {
  private readonly logger = new Logger(DiagnosticReportService.name);
  private s3: S3Client | null = null;
  private readonly bucket: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const region = config.get('AWS_REGION', 'ap-south-1');
    const key    = config.get('AWS_ACCESS_KEY_ID', '');
    const secret = config.get('AWS_SECRET_ACCESS_KEY', '');
    this.bucket  = config.get('S3_BUCKET', 'hospibot-reports');

    if (key && secret) {
      this.s3 = new S3Client({ region, credentials: { accessKeyId: key, secretAccessKey: secret } });
    } else {
      this.logger.warn('AWS credentials not set — PDF upload will be skipped');
    }
  }

  // ── Generate & upload lab report PDF ─────────────────────────────────────

  async generateAndUpload(tenantId: string, orderId: string): Promise<string | null> {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, tenantId },
      include: {
        patient: true,
        orderItems: {
          include: {
            resultEntries: { where: { isDraft: false }, orderBy: { version: 'desc' }, take: 1 },
          },
        },
        diagnosticReports: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, address: true, phone: true, email: true, logoUrl: true, settings: true },
    });

    const html = this.buildReportHtml(order, tenant);
    const pdfBuffer = await this.htmlToPdf(html);

    if (!pdfBuffer) {
      // Return the HTML as data URI as fallback for environments without Puppeteer
      this.logger.warn(`PDF generation skipped for order ${orderId} — using HTML fallback`);
      return null;
    }

    const s3Key = `reports/${tenantId}/${orderId}/report-v${(order.diagnosticReports as any[])[0]?.version ?? 1}.pdf`;
    const url = await this.uploadToS3(s3Key, pdfBuffer);

    if (url && order.diagnosticReports?.length) {
      await this.prisma.diagnosticReport.update({
        where: { id: (order.diagnosticReports as any[])[0].id },
        data: { pdfUrl: url, s3Key },
      });
    }

    return url;
  }

  // ── Build report HTML ─────────────────────────────────────────────────────

  buildReportHtml(order: any, tenant: any): string {
    const p = order.patient;
    const age = p?.dateOfBirth
      ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 86_400_000))
      : null;
    const report = (order.diagnosticReports ?? [])[0];
    const settings = tenant?.settings as any;
    const nablNumber = settings?.nabl?.accreditationNumber ?? '';
    const pathologist = settings?.labConfig?.pathologistName ?? '';

    const items = (order.orderItems ?? []).map((item: any) => {
      const result = item.resultEntries?.[0];
      const value = result ? (result.numericValue ?? result.textValue ?? '—') : '—';
      const unit = result?.unit ?? '';
      const flag = result?.flag ?? 'NORMAL';
      const lowerN = result?.lowerNormal;
      const upperN = result?.upperNormal;
      const refRange = lowerN != null && upperN != null ? `${lowerN} – ${upperN}` : '—';
      const flagColor = flag === 'CRITICAL_HIGH' || flag === 'CRITICAL_LOW' ? '#DC2626' :
                        flag === 'HIGH' || flag === 'LOW' ? '#D97706' : '#1E3A5F';
      const flagLabel = flag === 'CRITICAL_HIGH' ? '▲▲ CRITICAL' : flag === 'CRITICAL_LOW' ? '▼▼ CRITICAL' :
                        flag === 'HIGH' ? '▲ H' : flag === 'LOW' ? '▼ L' : '';
      return `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 16px;font-weight:600;color:#1e293b;">${item.testName}</td>
          <td style="padding:10px 16px;font-size:15px;font-weight:700;color:${flagColor};">
            ${value} ${unit}
            ${flagLabel ? `<span style="font-size:11px;margin-left:6px;font-weight:800;">${flagLabel}</span>` : ''}
          </td>
          <td style="padding:10px 16px;color:#64748b;">${refRange} ${unit}</td>
          <td style="padding:10px 16px;color:#64748b;font-size:12px;">${result?.interpretation ?? ''}</td>
        </tr>`;
    }).join('');

    const hasCritical = (order.orderItems ?? []).some((item: any) =>
      ['CRITICAL_HIGH', 'CRITICAL_LOW'].includes(item.resultEntries?.[0]?.flag)
    );

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1e293b; background: white; }
  .page { padding: 24px 32px; max-width: 900px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #1E3A5F; margin-bottom: 20px; }
  .lab-name { font-size: 22px; font-weight: 800; color: #1E3A5F; }
  .lab-contact { font-size: 11px; color: #64748b; margin-top: 4px; }
  .nabl { font-size: 10px; color: #0D7C66; font-weight: 700; margin-top: 2px; }
  .report-title { font-size: 15px; font-weight: 700; color: #1E3A5F; text-align: right; }
  .patient-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
  .patient-item label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
  .patient-item p { font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px; }
  .order-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #eff6ff; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; }
  .order-item label { font-size: 10px; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
  .order-item p { font-size: 12px; font-weight: 700; color: #1e293b; margin-top: 2px; }
  .critical-banner { background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; color: #dc2626; font-weight: 700; }
  .section-title { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead { background: #1E3A5F; }
  thead th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; color: white; letter-spacing: 0.5px; text-transform: uppercase; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
  .signature { text-align: right; }
  .signature .sig-line { width: 180px; border-bottom: 1px solid #1E3A5F; margin-bottom: 6px; }
  .signature .sig-name { font-size: 12px; font-weight: 700; color: #1E3A5F; }
  .signature .sig-title { font-size: 10px; color: #64748b; }
  .disclaimer { font-size: 10px; color: #94a3b8; max-width: 400px; line-height: 1.5; }
  .barcode { font-family: 'Courier New', monospace; font-size: 12px; color: #1E3A5F; font-weight: 700; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="lab-name">${tenant?.name ?? 'Diagnostic Lab'}</div>
      <div class="lab-contact">${[tenant?.address, tenant?.phone, tenant?.email].filter(Boolean).join(' · ')}</div>
      ${nablNumber ? `<div class="nabl">NABL Accredited · ${nablNumber}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div class="report-title">LAB TEST REPORT</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
        Report Date: ${new Date(order.releasedAt ?? order.updatedAt ?? Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
      ${report?.isAmended ? '<div style="font-size:11px;color:#f97316;font-weight:700;margin-top:2px;">⚠ AMENDED REPORT</div>' : ''}
    </div>
  </div>

  <!-- Patient Info -->
  <div class="patient-row">
    <div class="patient-item"><label>Patient Name</label><p>${p?.firstName ?? ''} ${p?.lastName ?? ''}</p></div>
    <div class="patient-item"><label>Age / Gender</label><p>${age ? `${age} Years` : '—'} / ${p?.gender ?? '—'}</p></div>
    <div class="patient-item"><label>Phone</label><p>${p?.phone ?? '—'}</p></div>
    <div class="patient-item"><label>Health ID</label><p>${p?.healthId ?? '—'}</p></div>
  </div>

  <!-- Order Info -->
  <div class="order-row">
    <div class="order-item"><label>Order ID</label><p>${order.orderNumber}</p></div>
    <div class="order-item"><label>Sample Collected</label><p>${order.sampleCollectedAt ? new Date(order.sampleCollectedAt).toLocaleDateString('en-IN') : '—'}</p></div>
    <div class="order-item"><label>Referred By</label><p>${order.referringDoctor ?? '—'}</p></div>
    <div class="order-item"><label>Sample Barcode</label><p class="barcode">${order.sampleBarcode ?? '—'}</p></div>
  </div>

  ${hasCritical ? `<div class="critical-banner">⚠ CRITICAL VALUES DETECTED — Immediate clinical attention required</div>` : ''}

  <!-- Results Table -->
  <div class="section-title">Test Results</div>
  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th>Result</th>
        <th>Reference Range</th>
        <th>Interpretation</th>
      </tr>
    </thead>
    <tbody>
      ${items || '<tr><td colspan="4" style="padding:20px;text-align:center;color:#94a3b8;">No results entered</td></tr>'}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div class="disclaimer">
      <p>This report is electronically generated and is valid without physical signature.</p>
      <p>Reference ranges may vary. Please correlate clinically. For queries contact the lab.</p>
      ${report?.signatureHash ? `<p style="margin-top:4px;color:#0D7C66;font-weight:600;">Digital Signature: ${report.signatureHash.slice(0, 20)}...</p>` : ''}
    </div>
    <div class="signature">
      <div class="sig-line"></div>
      <div class="sig-name">${pathologist || 'Authorised Signatory'}</div>
      <div class="sig-title">Pathologist / Lab Director</div>
    </div>
  </div>

</div>
</body>
</html>`;
  }

  // ── HTML → PDF using Puppeteer (optional dep) ─────────────────────────────

  private async htmlToPdf(html: string): Promise<Buffer | null> {
    try {
      // Try to use puppeteer if available
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      let puppeteer: any = null;
      try { puppeteer = require('puppeteer-core'); } catch {}
      if (!puppeteer) { try { puppeteer = require('puppeteer'); } catch {} }

      if (!puppeteer) {
        this.logger.warn('Puppeteer not installed — PDF skipped');
        return null;
      }

      const browser = await (puppeteer as any).launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined,
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      await browser.close();
      return Buffer.from(pdf);
    } catch (err: any) {
      this.logger.warn(`PDF generation failed: ${err.message}`);
      return null;
    }
  }

  // ── S3 upload ─────────────────────────────────────────────────────────────

  private async uploadToS3(key: string, buffer: Buffer): Promise<string | null> {
    if (!this.s3) return null;
    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
        CacheControl: 'max-age=86400',
      }));
      // Return pre-signed URL valid for 30 days
      const url = await getSignedUrl(this.s3, new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }), { expiresIn: 30 * 24 * 3600 });
      return url;
    } catch (err: any) {
      this.logger.error(`S3 upload failed: ${err.message}`);
      return null;
    }
  }

  // ── Get report HTML for inline view ──────────────────────────────────────

  async getReportHtml(tenantId: string, orderId: string, token: string): Promise<string> {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, tenantId },
      include: {
        patient: true,
        orderItems: {
          include: {
            resultEntries: { where: { isDraft: false }, orderBy: { version: 'desc' }, take: 1 },
          },
        },
        diagnosticReports: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Validate token (signature hash)
    const report = (order.diagnosticReports ?? [])[0];
    if (!report?.signatureHash?.startsWith(token.slice(0, 8))) {
      throw new NotFoundException('Invalid report token');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, address: true, phone: true, email: true, settings: true },
    });

    return this.buildReportHtml(order, tenant);
  }
}
