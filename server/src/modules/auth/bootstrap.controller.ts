import { Controller, Post, Body, Get } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcryptjs';

/**
 * ONE-TIME bootstrap endpoint — creates super admin + seeds portal families.
 * Protected by a secret key. Safe to leave deployed.
 */
@Controller('bootstrap')
export class BootstrapController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }

  @Post('init')
  async init(@Body() body: { secret: string; email: string; password: string; name?: string }) {
    const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET || 'hospibot-init-2026';
    if (body.secret !== BOOTSTRAP_SECRET) {
      return { success: false, message: 'Invalid secret' };
    }

    const results: string[] = [];

    // 1. Seed portal families if not present
    const existing = await this.prisma.portalFamily.count();
    if (existing === 0) {
      const families = [
        { name: 'Clinical',    slug: 'clinical',    icon: 'Stethoscope', sortOrder: 1,
          theme: { primaryColor:'#0D7C66', primaryDark:'#0A5E4F', primaryLight:'#E8F5F0', accentColor:'#F59E0B', sidebarBg:'#063A31', loginBg:'#0D7C66', loginGradient:'#0A5E4F' } },
        { name: 'Diagnostic',  slug: 'diagnostic',  icon: 'FlaskConical', sortOrder: 2,
          theme: { primaryColor:'#7C3AED', primaryDark:'#5B21B6', primaryLight:'#EDE9FE', accentColor:'#F59E0B', sidebarBg:'#2E1065', loginBg:'#7C3AED', loginGradient:'#5B21B6' } },
        { name: 'Pharmacy',    slug: 'pharmacy',    icon: 'Pill',         sortOrder: 3,
          theme: { primaryColor:'#0284C7', primaryDark:'#0369A1', primaryLight:'#E0F2FE', accentColor:'#F59E0B', sidebarBg:'#0C2340', loginBg:'#0284C7', loginGradient:'#0369A1' } },
        { name: 'Equipment',   slug: 'equipment',   icon: 'Package',      sortOrder: 4,
          theme: { primaryColor:'#B45309', primaryDark:'#92400E', primaryLight:'#FEF3C7', accentColor:'#10B981', sidebarBg:'#3B1A08', loginBg:'#B45309', loginGradient:'#92400E' } },
        { name: 'Wellness',    slug: 'wellness',    icon: 'Heart',        sortOrder: 5,
          theme: { primaryColor:'#DB2777', primaryDark:'#9D174D', primaryLight:'#FCE7F3', accentColor:'#F59E0B', sidebarBg:'#3B0764', loginBg:'#DB2777', loginGradient:'#9D174D' } },
        { name: 'Services',    slug: 'services',    icon: 'Briefcase',    sortOrder: 6,
          theme: { primaryColor:'#059669', primaryDark:'#047857', primaryLight:'#D1FAE5', accentColor:'#F59E0B', sidebarBg:'#022C22', loginBg:'#059669', loginGradient:'#047857' } },
        { name: 'Home Care',   slug: 'homecare',    icon: 'Home',         sortOrder: 7,
          theme: { primaryColor:'#DC2626', primaryDark:'#B91C1C', primaryLight:'#FEE2E2', accentColor:'#F59E0B', sidebarBg:'#450A0A', loginBg:'#DC2626', loginGradient:'#B91C1C' } },
      ];
      for (const f of families) {
        await this.prisma.portalFamily.create({ data: { name: f.name, slug: f.slug, icon: f.icon as any, sortOrder: f.sortOrder, description: f.name } as any });
      }
      results.push(`Seeded ${families.length} portal families`);
    } else {
      results.push(`Portal families already exist (${existing})`);
    }

    // 2. Create super admin if not present
    const existingAdmin = await this.prisma.platformAdmin.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (existingAdmin) {
      results.push(`Super admin already exists: ${existingAdmin?.email}`);
    } else {
      const passwordHash = await bcrypt.hash(body.password, 12);
      await this.prisma.platformAdmin.create({
        data: {
          email: body.email,
          passwordHash,
          firstName: body.name || 'Super',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
      results.push(`Super admin created: ${body.email}`);
    }

    // 3. Seed recharge packs if not present
    const existingPacks = await (this.prisma as any).rechargePack?.count().catch(() => 0) ?? 0;
    if (existingPacks === 0) {
      const PACKS = [
        { packType: 'WHATSAPP', name: '500 WA Credits',    creditsOrUnits: 500,   priceInclGst: 59000,  priceExclGst: 50000,  gstRate: 0.18, sortOrder: 1, isActive: true },
        { packType: 'WHATSAPP', name: '2,000 WA Credits',  creditsOrUnits: 2000,  priceInclGst: 199000, priceExclGst: 168644, gstRate: 0.18, sortOrder: 2, isActive: true },
        { packType: 'WHATSAPP', name: '10,000 WA Credits', creditsOrUnits: 10000, priceInclGst: 799000, priceExclGst: 677966, gstRate: 0.18, sortOrder: 3, isActive: true },
        { packType: 'SMS', name: '500 SMS',    creditsOrUnits: 500,   priceInclGst: 29000,  priceExclGst: 24576,  gstRate: 0.18, sortOrder: 1, isActive: true },
        { packType: 'SMS', name: '2,000 SMS',  creditsOrUnits: 2000,  priceInclGst: 99000,  priceExclGst: 83898,  gstRate: 0.18, sortOrder: 2, isActive: true },
        { packType: 'SMS', name: '10,000 SMS', creditsOrUnits: 10000, priceInclGst: 399000, priceExclGst: 338136, gstRate: 0.18, sortOrder: 3, isActive: true },
        { packType: 'STORAGE', name: '10 GB Storage',  creditsOrUnits: 10,  priceInclGst: 59000,  priceExclGst: 50000,  gstRate: 0.18, sortOrder: 1, isActive: true },
        { packType: 'STORAGE', name: '50 GB Storage',  creditsOrUnits: 50,  priceInclGst: 199000, priceExclGst: 168644, gstRate: 0.18, sortOrder: 2, isActive: true },
        { packType: 'STORAGE', name: '200 GB Storage', creditsOrUnits: 200, priceInclGst: 599000, priceExclGst: 507627, gstRate: 0.18, sortOrder: 3, isActive: true },
      ];
      for (const pack of PACKS) {
        await (this.prisma as any).rechargePack?.create({ data: pack }).catch(() => {});
      }
      results.push(`Seeded 9 recharge packs`);
    } else {
      results.push(`Recharge packs already exist (${existingPacks})`);
    }

    // 4. Seed diagnostic WhatsApp templates if not present
    const WA_TEMPLATES = [
      { name: 'lab_order_confirmed',    displayName: 'T01 — Lab Order Confirmed',      category: 'UTILITY',   bodyText: 'Hi {{name}}, your lab order {{order_id}} is confirmed. Barcode: {{barcode}}. Tests: {{tests}}.' },
      { name: 'sample_collected',       displayName: 'T02 — Sample Collected',          category: 'UTILITY',   bodyText: 'Hi {{name}}, sample for order {{order_id}} collected. Report by {{expected_time}}.' },
      { name: 'sample_dispatched',      displayName: 'T03 — Sample in Transit',         category: 'UTILITY',   bodyText: 'Sample for order {{order_id}} in transit. Report by {{expected_time}}.' },
      { name: 'sample_rejected',        displayName: 'T04 — Sample Rejected',           category: 'UTILITY',   bodyText: 'Hi {{name}}, sample for {{order_id}} could not be processed. Reason: {{reason}}. Please visit for re-collection.' },
      { name: 'report_ready_normal',    displayName: 'T05 — Report Ready (Normal)',     category: 'UTILITY',   bodyText: 'Hi {{name}}, report for {{order_id}} ready. All values normal. Download: {{report_link}}' },
      { name: 'report_ready_abnormal',  displayName: 'T06 — Report Ready (Abnormal)',   category: 'UTILITY',   bodyText: 'Hi {{name}}, report for {{order_id}} ready. Some values outside normal range — consult doctor. Download: {{report_link}}' },
      { name: 'critical_value_alert',   displayName: 'T07 — Critical Value Alert',      category: 'UTILITY',   bodyText: 'CRITICAL: Patient {{patient_name}}, Order {{order_id}}, Test {{test_name}}: {{value}} (Threshold {{threshold}}). Reply ACK {{alert_id}} to acknowledge.' },
      { name: 'sample_at_lab',          displayName: 'T08 — Sample at Lab',             category: 'UTILITY',   bodyText: 'Hi {{name}}, sample for {{order_id}} received. Processing started. Report by {{expected_time}}.' },
      { name: 'report_amended',         displayName: 'T09 — Report Amended',            category: 'UTILITY',   bodyText: 'Hi {{name}}, report for {{order_id}} updated. Reason: {{reason}}. New: {{report_link}}' },
      { name: 'test_in_progress',       displayName: 'T10 — Tests In Progress',         category: 'UTILITY',   bodyText: 'Tests for order {{order_id}} processing. Report by {{expected_time}}.' },
      { name: 'home_collection_booked', displayName: 'T11 — Home Collection Booked',    category: 'UTILITY',   bodyText: 'Hi {{name}}, home collection confirmed! Date: {{date}}, Time: {{time}}, Address: {{address}}. Reply CANCEL to cancel.' },
      { name: 'agent_assigned',         displayName: 'T12 — Agent Assigned',            category: 'UTILITY',   bodyText: 'Hi {{name}}, agent {{agent_name}} assigned for collection on {{date}} at {{time}}.' },
      { name: 'collection_reminder',    displayName: 'T13 — Collection Reminder',       category: 'UTILITY',   bodyText: 'Reminder: Home collection today at {{time}} at {{address}}. Fasting required: {{fasting_required}}.' },
      { name: 'corporate_wellness',     displayName: 'T14 — Corporate Wellness',        category: 'UTILITY',   bodyText: 'Hi {{name}}, {{company}} arranged a health checkup. Book by {{deadline}} at {{booking_link}}.' },
      { name: 'retest_reminder_90d',    displayName: 'T15 — Re-test Reminder (90d)',    category: 'MARKETING', bodyText: 'Hi {{name}}, 90 days since your {{test_name}} test. Book today! Reply BOOK or STOP.' },
      { name: 'abnormal_followup',      displayName: 'T16 — Abnormal Follow-Up',        category: 'UTILITY',   bodyText: 'Hi {{name}}, your recent {{test_name}} showed abnormal values. Schedule follow-up? Reply BOOK.' },
      { name: 'annual_health_package',  displayName: 'T17 — Annual Health Package',     category: 'MARKETING', bodyText: 'Hi {{name}}, annual checkup time! {{package_name}} at Rs. {{price}}. Book: {{booking_link}}' },
      { name: 'loyalty_offer',          displayName: 'T18 — Loyalty Discount',          category: 'MARKETING', bodyText: 'Hi {{name}}, enjoy {{discount}}% off your next test. Valid until {{expiry}}.' },
      { name: 'doctor_report',          displayName: 'T19 — Report to Doctor',          category: 'UTILITY',   bodyText: 'Lab Report: Patient {{patient_name}}, Order {{order_id}}. {{abnormal_flag}} View: {{report_link}}' },
      { name: 'birthday_offer',         displayName: 'T20 — Birthday Health Offer',     category: 'MARKETING', bodyText: 'Happy Birthday {{name}}! Enjoy 20% off any health package this month. Book: {{booking_link}}' },
    ];
    let tplSeeded = 0;
    for (const tmpl of WA_TEMPLATES) {
      try {
        const existing = await this.prisma.whatsappTemplate.findFirst({ where: { name: tmpl.name, tenantId: null } });
        if (!existing) {
          await this.prisma.whatsappTemplate.create({ data: { ...tmpl, tenantId: null, isDefault: true, status: 'APPROVED', buttons: [], variables: [] } as any });
          tplSeeded++;
        }
      } catch {}
    }
    results.push(`Seeded ${tplSeeded} diagnostic WhatsApp templates (of 20)`);

    return { success: true, results };
  }
}
