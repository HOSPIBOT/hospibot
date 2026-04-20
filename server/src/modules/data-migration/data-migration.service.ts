import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class DataMigrationService {
  private readonly logger = new Logger(DataMigrationService.name);
  constructor(private prisma: PrismaService) {}
  
  async importTestCatalog(tenantId: string, rows: any[]) {
    let imported = 0, skipped = 0, errors: string[] = [];
    for (const row of rows) {
      try {
        if (!row.name && !row.testName) { skipped++; continue; }
        await this.prisma.labTest.create({ data: {
          tenantId, name: row.name || row.testName, code: row.code || row.testCode || null,
          department: row.department || null, sampleType: row.sampleType || row.sample || null,
          price: row.price ? Number(row.price) * 100 : 0,
          turnaroundTime: row.tat || row.turnaroundTime || null,
          status: 'ACTIVE',
        }});
        imported++;
      } catch (err: any) {
        errors.push(`Row ${imported + skipped + 1}: ${err.message}`);
        skipped++;
      }
    }
    return { imported, skipped, errors: errors.slice(0, 10), total: rows.length };
  }

  async importPatients(tenantId: string, rows: any[]) {
    let imported = 0, skipped = 0, errors: string[] = [];
    for (const row of rows) {
      try {
        const phone = (row.phone || row.mobile || '').replace(/\D/g, '').slice(-10);
        if (!phone || phone.length < 10) { skipped++; continue; }
        const existing = await this.prisma.patient.findFirst({ where: { tenantId, phone } });
        if (existing) { skipped++; continue; }
        await this.prisma.patient.create({ data: {
          tenantId, phone,
          firstName: row.firstName || row.name?.split(' ')[0] || 'Unknown',
          lastName: row.lastName || row.name?.split(' ').slice(1).join(' ') || '',
          gender: row.gender || null, age: row.age ? Number(row.age) : null,
          email: row.email || null, address: row.address || null,
          city: row.city || null, pincode: row.pincode || null,
        }});
        imported++;
      } catch (err: any) {
        errors.push(`Row ${imported + skipped + 1}: ${err.message}`);
        skipped++;
      }
    }
    return { imported, skipped, errors: errors.slice(0, 10), total: rows.length };
  }

  async importDoctors(tenantId: string, rows: any[]) {
    let imported = 0, skipped = 0, errors: string[] = [];
    for (const row of rows) {
      try {
        if (!row.name && !row.doctorName) { skipped++; continue; }
        await this.prisma.referralDoctor.create({ data: {
          tenantId, name: row.name || row.doctorName,
          phone: row.phone || row.mobile || null,
          specialization: row.specialization || row.specialty || null,
          hospital: row.hospital || row.clinic || null,
          commissionPct: row.commission ? Number(row.commission) : null,
          status: 'ACTIVE',
        }});
        imported++;
      } catch (err: any) {
        errors.push(`Row ${imported + skipped + 1}: ${err.message}`);
        skipped++;
      }
    }
    return { imported, skipped, errors: errors.slice(0, 10), total: rows.length };
  }

  async importRateCards(tenantId: string, rows: any[]) {
    let imported = 0, skipped = 0;
    for (const row of rows) {
      try {
        if (!row.testName && !row.name) { skipped++; continue; }
        const test = await this.prisma.labTest.findFirst({ where: { tenantId, name: { contains: row.testName || row.name, mode: 'insensitive' } } });
        if (test) {
          await this.prisma.labTest.update({ where: { id: test.id }, data: { price: row.price ? Number(row.price) * 100 : test.price } });
          imported++;
        } else { skipped++; }
      } catch { skipped++; }
    }
    return { imported, skipped, total: rows.length };
  }
}
