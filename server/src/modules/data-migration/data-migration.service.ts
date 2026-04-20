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
        await this.prisma.testCatalog.create({ data: {
          tenantId, name: row.name || row.testName, code: row.code || row.testCode || 'IMPORT',
          category: row.category || row.department || 'General',
          sampleType: row.sampleType || row.sample || 'Blood',
          price: row.price ? Number(row.price) * 100 : 0,
          turnaroundHrs: row.tat ? Number(row.tat) : 24,
          isActive: true,
        }});
        imported++;
      } catch (err: any) {
        errors.push(`Row ${imported + skipped + 1}: ${err.message?.substring(0, 100)}`);
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
          gender: row.gender === 'M' || row.gender === 'Male' ? 'MALE' : row.gender === 'F' || row.gender === 'Female' ? 'FEMALE' : undefined,
          dateOfBirth: row.dob ? new Date(row.dob) : undefined,
          email: row.email || undefined, address: row.address || undefined,
          city: row.city || undefined, pincode: row.pincode || undefined,
        }});
        imported++;
      } catch (err: any) {
        errors.push(`Row ${imported + skipped + 1}: ${err.message?.substring(0, 100)}`);
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
        const phone = (row.phone || row.mobile || '').replace(/\D/g, '').slice(-10);
        if (!phone) { skipped++; continue; }
        await this.prisma.doctorCRM.create({ data: {
          tenantId, name: row.name || row.doctorName, mobile: phone,
          specialty: row.specialization || row.specialty || undefined,
          clinicName: row.hospital || row.clinic || undefined,
          incentiveRate: row.commission ? Number(row.commission) * 100 : undefined,
          isActive: true,
        }});
        imported++;
      } catch (err: any) {
        errors.push(`Row ${imported + skipped + 1}: ${err.message?.substring(0, 100)}`);
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
        const test = await this.prisma.testCatalog.findFirst({ where: { tenantId, name: { contains: row.testName || row.name, mode: 'insensitive' } } });
        if (test) {
          await this.prisma.testCatalog.update({ where: { id: test.id }, data: { price: row.price ? Number(row.price) * 100 : test.price } });
          imported++;
        } else { skipped++; }
      } catch { skipped++; }
    }
    return { imported, skipped, total: rows.length };
  }
}
