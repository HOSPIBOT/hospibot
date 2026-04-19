import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ──────────────────────────────────────────────
// ICMR AMR-mandated alert organisms
// Per ICMR AMRSN guidelines + India NAP-AMR 2017
// ──────────────────────────────────────────────
const ALERT_ORGANISMS = [
  'MRSA',                    // Methicillin-resistant S. aureus
  'VRE',                     // Vancomycin-resistant Enterococcus
  'ESBL',                    // Extended-spectrum beta-lactamase
  'CRE',                     // Carbapenem-resistant Enterobacterales
  'CRPA',                    // Carbapenem-resistant P. aeruginosa
  'CRAB',                    // Carbapenem-resistant A. baumannii
  'Candida auris',           // WHO critical priority
];

// CLSI M39 minimum isolate count for valid antibiogram
const CLSI_M39_MIN_ISOLATES = 30;

// Drug classes per ICMR treatment guidelines
const DRUG_CLASSES: Record<string, string> = {
  AMP: 'Penicillins', AMC: 'Penicillins', PIP: 'Penicillins', TZP: 'Penicillins',
  CXM: 'Cephalosporins', CTX: 'Cephalosporins', CRO: 'Cephalosporins', CAZ: 'Cephalosporins',
  FEP: 'Cephalosporins', CPT: 'Cephalosporins',
  IPM: 'Carbapenems', MEM: 'Carbapenems', ETP: 'Carbapenems', DOR: 'Carbapenems',
  CIP: 'Fluoroquinolones', LVX: 'Fluoroquinolones', MFX: 'Fluoroquinolones', OFX: 'Fluoroquinolones',
  AMK: 'Aminoglycosides', GEN: 'Aminoglycosides', TOB: 'Aminoglycosides', NET: 'Aminoglycosides',
  AZM: 'Macrolides', ERY: 'Macrolides', CLR: 'Macrolides',
  VAN: 'Glycopeptides', TEC: 'Glycopeptides',
  LZD: 'Oxazolidinones', TGC: 'Tetracyclines', DOX: 'Tetracyclines', MIN: 'Tetracyclines',
  SXT: 'Sulfonamides', NIT: 'Nitrofurans', CST: 'Polymyxins', PLB: 'Polymyxins',
  FOF: 'Fosfomycins', MTZ: 'Nitroimidazoles', CLI: 'Lincosamides', RIF: 'Rifamycins',
};

@Injectable()
export class AntibiogramService {
  private readonly logger = new Logger(AntibiogramService.name);

  constructor(private prisma: PrismaService) {}

  // ─── LIST ───────────────────────────────────
  async findAll(tenantId: string, query: any) {
    try {
      const {
        page = 1, limit = 20,
        status, organism, specimenType,
        from, to, search,
      } = query;

      const where: any = { tenantId };
      if (status) where.status = status;
      if (organism) where.organism = { contains: organism, mode: 'insensitive' };
      if (specimenType) where.specimenType = specimenType;
      if (from || to) {
        where.specimenDate = {};
        if (from) where.specimenDate.gte = new Date(from);
        if (to) where.specimenDate.lte = new Date(to);
      }
      if (search) {
        where.OR = [
          { organism: { contains: search, mode: 'insensitive' } },
          { patientName: { contains: search, mode: 'insensitive' } },
          { patientUhid: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.antibiogram.findMany({
          where,
          include: { results: true },
          orderBy: { specimenDate: 'desc' },
          skip: (page - 1) * limit,
          take: Number(limit),
        }),
        this.prisma.antibiogram.count({ where }),
      ]);

      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) {
      this.logger.error('findAll error', err);
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  // ─── GET ONE ────────────────────────────────
  async findOne(tenantId: string, id: string) {
    try {
      return await this.prisma.antibiogram.findFirst({
        where: { id, tenantId },
        include: { results: { orderBy: { antibiotic: 'asc' } } },
      });
    } catch (err) {
      this.logger.error('findOne error', err);
      return null;
    }
  }

  // ─── CREATE ─────────────────────────────────
  async create(tenantId: string, dto: any, userId: string) {
    try {
      // Validate mandatory fields per CLSI M100
      if (!dto.organism) throw new BadRequestException('Organism is required per CLSI M100');
      if (!dto.specimenType) throw new BadRequestException('Specimen type is required');
      if (!dto.specimenDate) throw new BadRequestException('Specimen collection date is required');

      // Auto-detect resistance alerts per ICMR AMRSN
      const alerts = this.detectAlerts(dto);

      const antibiogram = await this.prisma.antibiogram.create({
        data: {
          tenantId,
          cultureId: dto.cultureId || null,
          labOrderId: dto.labOrderId || null,
          sampleId: dto.sampleId || null,
          patientId: dto.patientId || null,
          patientName: dto.patientName || null,
          patientUhid: dto.patientUhid || null,
          specimenType: dto.specimenType,
          specimenDate: new Date(dto.specimenDate),
          organism: dto.organism,
          organismCode: dto.organismCode || null,
          isolateNumber: dto.isolateNumber || 1,
          method: dto.method || 'disk-diffusion',
          breakpointStd: dto.breakpointStd || 'CLSI',
          breakpointYear: dto.breakpointYear || null,
          status: 'draft',
          notes: dto.notes || null,
          mrsaDetected: alerts.mrsa,
          esblDetected: alerts.esbl,
          crbDetected: alerts.crb,
          vrDetected: alerts.vr,
          createdBy: userId,
          results: dto.results?.length ? {
            create: dto.results.map((r: any) => ({
              antibiotic: r.antibiotic,
              antibioticCode: r.antibioticCode || null,
              drugClass: r.drugClass || DRUG_CLASSES[r.antibioticCode] || null,
              testMethod: r.testMethod || null,
              zoneDiameter: r.zoneDiameter ? Number(r.zoneDiameter) : null,
              micValue: r.micValue ? Number(r.micValue) : null,
              micSign: r.micSign || null,
              interpretation: r.interpretation,
              breakpointS: r.breakpointS || null,
              breakpointR: r.breakpointR || null,
              isAlert: this.isAlertResult(dto.organism, r.antibiotic, r.interpretation),
              alertReason: this.getAlertReason(dto.organism, r.antibiotic, r.interpretation),
            })),
          } : undefined,
        },
        include: { results: true },
      });

      return antibiogram;
    } catch (err) {
      this.logger.error('create error', err);
      throw err;
    }
  }

  // ─── UPDATE ─────────────────────────────────
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.antibiogram.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Antibiogram not found');
      if (existing.status === 'reported') {
        throw new BadRequestException('Cannot modify a reported antibiogram. Create an amendment instead.');
      }

      // If results are being updated, delete old ones and recreate
      if (dto.results) {
        await this.prisma.antibiogramResult.deleteMany({ where: { antibiogramId: id } });
      }

      const alerts = this.detectAlerts({ ...existing, ...dto });

      return await this.prisma.antibiogram.update({
        where: { id },
        data: {
          ...(dto.organism && { organism: dto.organism }),
          ...(dto.organismCode !== undefined && { organismCode: dto.organismCode }),
          ...(dto.specimenType && { specimenType: dto.specimenType }),
          ...(dto.specimenDate && { specimenDate: new Date(dto.specimenDate) }),
          ...(dto.method && { method: dto.method }),
          ...(dto.breakpointStd && { breakpointStd: dto.breakpointStd }),
          ...(dto.breakpointYear !== undefined && { breakpointYear: dto.breakpointYear }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.status && { status: dto.status }),
          mrsaDetected: alerts.mrsa,
          esblDetected: alerts.esbl,
          crbDetected: alerts.crb,
          vrDetected: alerts.vr,
          ...(dto.results ? {
            results: {
              create: dto.results.map((r: any) => ({
                antibiotic: r.antibiotic,
                antibioticCode: r.antibioticCode || null,
                drugClass: r.drugClass || DRUG_CLASSES[r.antibioticCode] || null,
                testMethod: r.testMethod || null,
                zoneDiameter: r.zoneDiameter ? Number(r.zoneDiameter) : null,
                micValue: r.micValue ? Number(r.micValue) : null,
                micSign: r.micSign || null,
                interpretation: r.interpretation,
                breakpointS: r.breakpointS || null,
                breakpointR: r.breakpointR || null,
                isAlert: this.isAlertResult(dto.organism || existing.organism, r.antibiotic, r.interpretation),
                alertReason: this.getAlertReason(dto.organism || existing.organism, r.antibiotic, r.interpretation),
              })),
            },
          } : {}),
        },
        include: { results: true },
      });
    } catch (err) {
      this.logger.error('update error', err);
      throw err;
    }
  }

  // ─── VERIFY (Microbiologist sign-off) ───────
  async verify(tenantId: string, id: string, userId: string) {
    try {
      const existing = await this.prisma.antibiogram.findFirst({
        where: { id, tenantId },
        include: { results: true },
      });
      if (!existing) throw new BadRequestException('Antibiogram not found');
      if (existing.results.length === 0) {
        throw new BadRequestException('Cannot verify an antibiogram with no AST results');
      }

      return await this.prisma.antibiogram.update({
        where: { id },
        data: {
          status: 'verified',
          verifiedBy: userId,
          verifiedAt: new Date(),
        },
        include: { results: true },
      });
    } catch (err) {
      this.logger.error('verify error', err);
      throw err;
    }
  }

  // ─── CUMULATIVE ANTIBIOGRAM (per CLSI M39) ──
  async getCumulativeAntibiogram(tenantId: string, query: any) {
    try {
      const { from, to, specimenType } = query;

      const where: any = {
        tenantId,
        status: { in: ['verified', 'reported'] },
      };
      if (from || to) {
        where.specimenDate = {};
        if (from) where.specimenDate.gte = new Date(from);
        if (to) where.specimenDate.lte = new Date(to);
      }
      if (specimenType) where.specimenType = specimenType;

      const antibiograms = await this.prisma.antibiogram.findMany({
        where,
        include: { results: true },
        orderBy: { specimenDate: 'asc' },
      });

      // CLSI M39: First isolate per patient per species per analysis period
      const firstIsolateMap = new Map<string, typeof antibiograms[0]>();
      for (const abg of antibiograms) {
        const key = `${abg.patientId || abg.patientUhid || abg.id}::${abg.organism}`;
        if (!firstIsolateMap.has(key)) {
          firstIsolateMap.set(key, abg);
        }
      }
      const deduplicated = Array.from(firstIsolateMap.values());

      // Build organism → antibiotic → { S, I, R, total } matrix
      const matrix: Record<string, Record<string, { s: number; i: number; r: number; total: number }>> = {};
      const organismCounts: Record<string, number> = {};

      for (const abg of deduplicated) {
        const org = abg.organism;
        organismCounts[org] = (organismCounts[org] || 0) + 1;
        if (!matrix[org]) matrix[org] = {};

        for (const result of abg.results) {
          const abx = result.antibiotic;
          if (!matrix[org][abx]) matrix[org][abx] = { s: 0, i: 0, r: 0, total: 0 };
          matrix[org][abx].total++;
          if (result.interpretation === 'S') matrix[org][abx].s++;
          else if (result.interpretation === 'I' || result.interpretation === 'SDD') matrix[org][abx].i++;
          else if (result.interpretation === 'R') matrix[org][abx].r++;
        }
      }

      // Convert to % susceptible format
      const cumulativeData = Object.entries(matrix).map(([organism, antibiotics]) => ({
        organism,
        isolateCount: organismCounts[organism],
        meetsClsiM39: organismCounts[organism] >= CLSI_M39_MIN_ISOLATES,
        antibiotics: Object.entries(antibiotics).map(([antibiotic, counts]) => ({
          antibiotic,
          drugClass: DRUG_CLASSES[antibiotic] || null,
          tested: counts.total,
          susceptible: counts.s,
          intermediate: counts.i,
          resistant: counts.r,
          percentSusceptible: counts.total > 0 ? Math.round((counts.s / counts.total) * 100) : 0,
          percentResistant: counts.total > 0 ? Math.round((counts.r / counts.total) * 100) : 0,
        })),
      }));

      return {
        data: cumulativeData,
        period: { from: from || null, to: to || null },
        totalIsolates: deduplicated.length,
        totalRawRecords: antibiograms.length,
        deduplicationMethod: 'CLSI M39 — first isolate per patient per species',
        minIsolatesForValidity: CLSI_M39_MIN_ISOLATES,
      };
    } catch (err) {
      this.logger.error('getCumulativeAntibiogram error', err);
      return { data: [], totalIsolates: 0, totalRawRecords: 0 };
    }
  }

  // ─── WHONET EXPORT (CSV format) ─────────────
  async exportWhonet(tenantId: string, query: any) {
    try {
      const { from, to } = query;
      const where: any = {
        tenantId,
        status: { in: ['verified', 'reported'] },
      };
      if (from || to) {
        where.specimenDate = {};
        if (from) where.specimenDate.gte = new Date(from);
        if (to) where.specimenDate.lte = new Date(to);
      }

      const antibiograms = await this.prisma.antibiogram.findMany({
        where,
        include: { results: true },
        orderBy: { specimenDate: 'asc' },
      });

      // WHONET standard fields
      const headers = [
        'PATIENT_ID', 'LAST_NAME', 'SPEC_NUM', 'SPEC_DATE', 'SPEC_TYPE',
        'ORGANISM', 'ORG_CODE', 'ISOLATE_NUM',
      ];

      // Collect all unique antibiotic codes
      const allAbxCodes = new Set<string>();
      antibiograms.forEach(abg =>
        abg.results.forEach(r => { if (r.antibioticCode) allAbxCodes.add(r.antibioticCode); })
      );
      const abxCodes = Array.from(allAbxCodes).sort();
      headers.push(...abxCodes);

      const rows = antibiograms.map(abg => {
        const row: Record<string, string> = {
          PATIENT_ID: abg.patientUhid || abg.patientId || '',
          LAST_NAME: abg.patientName || '',
          SPEC_NUM: abg.sampleId || abg.id,
          SPEC_DATE: abg.specimenDate.toISOString().split('T')[0],
          SPEC_TYPE: abg.specimenType,
          ORGANISM: abg.organism,
          ORG_CODE: abg.organismCode || '',
          ISOLATE_NUM: String(abg.isolateNumber),
        };
        // Fill antibiotic columns with interpretation
        for (const code of abxCodes) {
          const result = abg.results.find(r => r.antibioticCode === code);
          row[code] = result ? result.interpretation : '';
        }
        return row;
      });

      // Build CSV
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${(r[h] || '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return { csv, filename: `whonet_export_${new Date().toISOString().split('T')[0]}.csv`, count: rows.length };
    } catch (err) {
      this.logger.error('exportWhonet error', err);
      return { csv: '', filename: '', count: 0 };
    }
  }

  // ─── AMR ALERT STATS ───────────────────────
  async getAlertStats(tenantId: string, query: any) {
    try {
      const { from, to } = query;
      const where: any = { tenantId };
      if (from || to) {
        where.specimenDate = {};
        if (from) where.specimenDate.gte = new Date(from);
        if (to) where.specimenDate.lte = new Date(to);
      }

      const [total, mrsaCount, esblCount, crbCount, vrCount] = await Promise.all([
        this.prisma.antibiogram.count({ where }),
        this.prisma.antibiogram.count({ where: { ...where, mrsaDetected: true } }),
        this.prisma.antibiogram.count({ where: { ...where, esblDetected: true } }),
        this.prisma.antibiogram.count({ where: { ...where, crbDetected: true } }),
        this.prisma.antibiogram.count({ where: { ...where, vrDetected: true } }),
      ]);

      return {
        total,
        alerts: {
          mrsa: mrsaCount,
          esbl: esblCount,
          carbapenemResistant: crbCount,
          vancomycinResistant: vrCount,
        },
      };
    } catch (err) {
      this.logger.error('getAlertStats error', err);
      return { total: 0, alerts: { mrsa: 0, esbl: 0, carbapenemResistant: 0, vancomycinResistant: 0 } };
    }
  }

  // ─── PRIVATE: Detect resistance alerts ──────
  private detectAlerts(dto: any) {
    const results = dto.results || [];
    const organism = (dto.organism || '').toLowerCase();
    let mrsa = false, esbl = false, crb = false, vr = false;

    // MRSA: S. aureus resistant to oxacillin/cefoxitin
    if (organism.includes('staphylococcus') && organism.includes('aureus')) {
      mrsa = results.some((r: any) =>
        ['OXA', 'FOX', 'oxacillin', 'cefoxitin'].some(a =>
          (r.antibioticCode || r.antibiotic || '').toLowerCase().includes(a.toLowerCase())
        ) && r.interpretation === 'R'
      );
    }

    // ESBL: Enterobacterales with 3rd gen ceph resistance
    const enterobacterales = ['e.coli', 'escherichia', 'klebsiella', 'enterobacter', 'proteus', 'citrobacter', 'serratia'];
    if (enterobacterales.some(e => organism.includes(e))) {
      esbl = results.some((r: any) =>
        ['CTX', 'CRO', 'CAZ', 'ceftriaxone', 'cefotaxime', 'ceftazidime'].some(a =>
          (r.antibioticCode || r.antibiotic || '').toLowerCase().includes(a.toLowerCase())
        ) && r.interpretation === 'R'
      );
    }

    // CRB: Carbapenem resistance in any gram-negative
    crb = results.some((r: any) =>
      ['IPM', 'MEM', 'ETP', 'DOR', 'imipenem', 'meropenem', 'ertapenem', 'doripenem'].some(a =>
        (r.antibioticCode || r.antibiotic || '').toLowerCase().includes(a.toLowerCase())
      ) && r.interpretation === 'R'
    );

    // VR: Vancomycin resistance in Enterococcus/Staphylococcus
    if (organism.includes('enterococcus') || organism.includes('staphylococcus')) {
      vr = results.some((r: any) =>
        ['VAN', 'vancomycin'].some(a =>
          (r.antibioticCode || r.antibiotic || '').toLowerCase().includes(a.toLowerCase())
        ) && r.interpretation === 'R'
      );
    }

    return { mrsa, esbl, crb, vr };
  }

  private isAlertResult(organism: string, antibiotic: string, interpretation: string): boolean {
    if (interpretation !== 'R') return false;
    const org = (organism || '').toLowerCase();
    const abx = (antibiotic || '').toLowerCase();

    // MRSA
    if (org.includes('staphylococcus') && org.includes('aureus') &&
        (abx.includes('oxacillin') || abx.includes('cefoxitin'))) return true;
    // VRE
    if (org.includes('enterococcus') && abx.includes('vancomycin')) return true;
    // CRE
    if (['imipenem', 'meropenem', 'ertapenem', 'doripenem'].some(c => abx.includes(c))) return true;
    // Colistin resistance (last resort)
    if (abx.includes('colistin') || abx.includes('polymyxin')) return true;

    return false;
  }

  private getAlertReason(organism: string, antibiotic: string, interpretation: string): string | null {
    if (interpretation !== 'R') return null;
    const org = (organism || '').toLowerCase();
    const abx = (antibiotic || '').toLowerCase();

    if (org.includes('staphylococcus') && org.includes('aureus') &&
        (abx.includes('oxacillin') || abx.includes('cefoxitin')))
      return 'MRSA detected — notify Infection Control per ICMR AMRSN';

    if (org.includes('enterococcus') && abx.includes('vancomycin'))
      return 'VRE detected — notify Infection Control per ICMR AMRSN';

    if (['imipenem', 'meropenem', 'ertapenem', 'doripenem'].some(c => abx.includes(c)))
      return 'Carbapenem-resistant organism — report to ICMR AMR Network';

    if (abx.includes('colistin') || abx.includes('polymyxin'))
      return 'Colistin/Polymyxin resistance — critical alert per WHO priority pathogen list';

    return null;
  }
}
