#!/usr/bin/env node
/**
 * HospiBot Remote Seed Script
 * Calls the deployed API to seed:
 *   1. Recharge packs (9 packs: WA/SMS/Storage)
 *   2. Diagnostic WA templates (T01-T20)
 * 
 * Usage:
 *   ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=yourpassword node remote-seed.js
 *   
 *   Or with tenant-specific catalog seed:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... TENANT_ID=... node remote-seed.js --catalog
 */

const BASE_URL = process.env.API_URL || 'https://hospibotserver-production.up.railway.app/api/v1';
const EMAIL    = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const TENANT_ID = process.env.TENANT_ID;
const SEED_CATALOG = process.argv.includes('--catalog');

if (!EMAIL || !PASSWORD) {
  console.error('❌  Set ADMIN_EMAIL and ADMIN_PASSWORD env vars');
  console.error('   Example: ADMIN_EMAIL=admin@lab.com ADMIN_PASSWORD=secret node remote-seed.js');
  process.exit(1);
}

async function req(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function main() {
  console.log(`\n🌱  HospiBot Remote Seed — ${BASE_URL}\n`);

  // ── 1. Login ──────────────────────────────────────────────────────────────
  process.stdout.write('🔐  Logging in... ');
  const loginRes = await req('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (!loginRes.ok) {
    console.error('FAILED\n   ', loginRes.data?.message || loginRes.data);
    process.exit(1);
  }
  const token = loginRes.data.accessToken || loginRes.data.token;
  if (!token) {
    console.error('FAILED — no token in response:', loginRes.data);
    process.exit(1);
  }
  console.log(`✅  Logged in as ${EMAIL}`);

  // ── 2. Seed Recharge Packs ────────────────────────────────────────────────
  process.stdout.write('💳  Seeding recharge packs... ');
  const packsRes = await req('POST', '/diagnostic/billing/packs/seed', {}, token);
  if (packsRes.ok) {
    console.log(`✅  ${packsRes.data?.seeded ?? '?'} packs seeded`);
  } else {
    console.log(`⚠️   ${packsRes.status} — ${packsRes.data?.message || 'already seeded or error'}`);
  }

  // ── 3. Seed WA Templates (via direct DB or API) ───────────────────────────
  // The WA templates seed is in prisma/seed.ts — call it via the whatsapp templates API
  process.stdout.write('📱  Seeding WhatsApp templates... ');
  
  const WA_TEMPLATES = [
    { name: 'lab_order_confirmed',    displayName: 'T01 — Lab Order Confirmed',       category: 'UTILITY',
      bodyText: 'Hi {{name}}, your lab order {{order_id}} has been confirmed. Barcode: {{barcode}}. Tests: {{tests}}.' },
    { name: 'sample_collected',       displayName: 'T02 — Sample Collected',           category: 'UTILITY',
      bodyText: 'Hi {{name}}, sample for order {{order_id}} collected. Report expected by {{expected_time}}.' },
    { name: 'sample_dispatched',      displayName: 'T03 — Sample in Transit',          category: 'UTILITY',
      bodyText: 'Your sample for order {{order_id}} is in transit. Expected by {{expected_time}}.' },
    { name: 'sample_rejected',        displayName: 'T04 — Sample Rejected',            category: 'UTILITY',
      bodyText: 'Hi {{name}}, sample for {{order_id}} could not be processed. Reason: {{reason}}. Please visit for re-collection.' },
    { name: 'report_ready_normal',    displayName: 'T05 — Report Ready (Normal)',      category: 'UTILITY',
      bodyText: 'Hi {{name}}, your report for {{order_id}} is ready. All values normal. Download: {{report_link}}' },
    { name: 'report_ready_abnormal',  displayName: 'T06 — Report Ready (Abnormal)',    category: 'UTILITY',
      bodyText: 'Hi {{name}}, report for {{order_id}} ready. ⚠️ Some values outside normal range — please consult doctor. Download: {{report_link}}' },
    { name: 'critical_value_alert',   displayName: 'T07 — Critical Value Alert',       category: 'UTILITY',
      bodyText: '🚨 CRITICAL VALUE: Patient {{patient_name}}, Order {{order_id}}, Test {{test_name}}: {{value}} (Threshold: {{threshold}}). Reply ACK {{alert_id}} to acknowledge.' },
    { name: 'sample_at_lab',          displayName: 'T08 — Sample Received at Lab',     category: 'UTILITY',
      bodyText: 'Hi {{name}}, your sample for {{order_id}} has been received at the lab. Processing started. Report by {{expected_time}}.' },
    { name: 'report_amended',         displayName: 'T09 — Report Amended',             category: 'UTILITY',
      bodyText: 'Hi {{name}}, your report for {{order_id}} has been updated. Reason: {{reason}}. New report: {{report_link}}' },
    { name: 'test_in_progress',       displayName: 'T10 — Tests In Progress',          category: 'UTILITY',
      bodyText: 'Your tests for order {{order_id}} are being processed. Report expected by {{expected_time}}.' },
    { name: 'home_collection_booked', displayName: 'T11 — Home Collection Booked',     category: 'UTILITY',
      bodyText: 'Hi {{name}}, home collection confirmed! Date: {{date}}, Time: {{time}}, Address: {{address}}. Reply CANCEL to cancel.' },
    { name: 'agent_assigned',         displayName: 'T12 — Collection Agent Assigned',  category: 'UTILITY',
      bodyText: 'Hi {{name}}, agent {{agent_name}} assigned for your collection on {{date}} at {{time}}.' },
    { name: 'collection_reminder',    displayName: 'T13 — Collection Reminder',        category: 'UTILITY',
      bodyText: 'Reminder: Home collection today at {{time}} at {{address}}. Fasting required: {{fasting_required}}.' },
    { name: 'corporate_wellness_invite', displayName: 'T14 — Corporate Wellness Invite', category: 'UTILITY',
      bodyText: 'Hi {{name}}, {{company}} has arranged a health checkup. Book by {{deadline}} at {{booking_link}}.' },
    { name: 'retest_reminder_90d',    displayName: 'T15 — Re-test Reminder (90d)',     category: 'MARKETING',
      bodyText: 'Hi {{name}}, it has been 90 days since your {{test_name}} test. Book today! Reply BOOK to confirm or STOP to unsubscribe.' },
    { name: 'abnormal_followup',      displayName: 'T16 — Abnormal Result Follow-Up',  category: 'UTILITY',
      bodyText: 'Hi {{name}}, your recent {{test_name}} showed abnormal values. Monitor your health — schedule a follow-up? Reply BOOK.' },
    { name: 'annual_health_package',  displayName: 'T17 — Annual Health Package',      category: 'MARKETING',
      bodyText: 'Hi {{name}}, time for your annual checkup! {{package_name}} ({{tests}} tests) at just ₹{{price}}. Book: {{booking_link}}' },
    { name: 'loyalty_offer',          displayName: 'T18 — Loyalty Discount',           category: 'MARKETING',
      bodyText: 'Hi {{name}}, thank you for {{visit_count}} visits! Enjoy {{discount}}% off your next test. Valid until {{expiry}}.' },
    { name: 'doctor_report_delivery', displayName: 'T19 — Report to Doctor',           category: 'UTILITY',
      bodyText: 'Lab Report: Patient {{patient_name}}, Order {{order_id}}. {{abnormal_flag}} View: {{report_link}}' },
    { name: 'birthday_health_offer',  displayName: 'T20 — Birthday Health Offer',      category: 'MARKETING',
      bodyText: 'Happy Birthday {{name}}! 🎂 Enjoy 20% off any health package this month. Book: {{booking_link}}' },
  ];

  let tplSeeded = 0, tplSkipped = 0;
  for (const tmpl of WA_TEMPLATES) {
    const r = await req('POST', '/whatsapp/templates', {
      ...tmpl, variables: Object.keys(
        (tmpl.bodyText.match(/\{\{(\w+)\}\}/g) || [])
          .reduce((a, k) => ({ ...a, [k.replace(/[{}]/g,'')]: 1 }), {})
      ),
      isDefault: true, status: 'APPROVED', tenantId: null,
    }, token).catch(() => ({ ok: false }));
    if (r.ok) tplSeeded++; else tplSkipped++;
  }
  console.log(`✅  ${tplSeeded} templates seeded, ${tplSkipped} skipped (already exist)`);

  // ── 4. Optional: Seed catalog for specific tenant ─────────────────────────
  if (SEED_CATALOG) {
    if (!TENANT_ID) {
      // Try to get current tenant
      const meRes = await req('GET', '/tenants/current', null, token);
      const tid = meRes.data?.id || meRes.data?.tenantId;
      if (tid) {
        process.stdout.write(`🧪  Seeding test catalog for tenant ${tid}... `);
        const catRes = await req('POST', '/diagnostic/catalog/seed', {}, token);
        console.log(`✅  ${catRes.data?.seeded ?? '?'} tests seeded`);
      }
    } else {
      process.stdout.write(`🧪  Seeding catalog for tenant ${TENANT_ID}... `);
      const catRes = await req('POST', '/diagnostic/catalog/seed', {}, token);
      console.log(`✅  ${catRes.data?.seeded ?? '?'} tests seeded`);
    }
  }

  console.log('\n🎉  Seed complete!\n');
  
  if (!SEED_CATALOG) {
    console.log('   To also seed the test catalog for your tenant, run:');
    console.log('   ADMIN_EMAIL=... ADMIN_PASSWORD=... node remote-seed.js --catalog\n');
  }
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
