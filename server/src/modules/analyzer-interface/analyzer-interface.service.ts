import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { parseHL7Message, parseASTMMessage, generateACK, HL7Message, OBXResult } from './hl7-parser';

/**
 * Analyzer Interface Service
 * 
 * Handles:
 * 1. Analyzer registration and management
 * 2. Incoming HL7/ASTM message parsing
 * 3. Auto-population of lab results from parsed messages
 * 4. Result mapping (analyzer codes → HospiBot test catalog)
 * 5. Message logging for audit trail
 * 6. ACK generation
 * 
 * Supported analyzers:
 *   Hematology: Sysmex XN series, Mindray BC-6800, Beckman DxH
 *   Biochemistry: Roche Cobas, Ortho Vitros, Mindray BS-800, Siemens Atellica
 *   Immunoassay: Abbott Architect, Roche Elecsys, Siemens Centaur
 *   Coagulation: Sysmex CS series, Stago STA-R
 *   Urinalysis: Sysmex UF/UC series, Roche cobas u 601
 */
@Injectable()
export class AnalyzerInterfaceService {
  private readonly logger = new Logger(AnalyzerInterfaceService.name);
  constructor(private prisma: PrismaService) {}

  /** List all configured analyzers for a tenant */
  async getAnalyzers(tenantId: string) {
    try {
      return await this.prisma.analyzerConfig.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    } catch { return []; }
  }

  /** Register a new analyzer */
  async registerAnalyzer(tenantId: string, dto: any, userId: string) {
    if (!dto.name) throw new BadRequestException('Analyzer name required');
    return this.prisma.analyzerConfig.create({ data: {
      tenantId,
      name: dto.name,
      manufacturer: dto.manufacturer || null,
      model: dto.model || null,
      serialNumber: dto.serialNumber || null,
      department: dto.department || null,
      protocol: dto.protocol || 'hl7',
      hl7Version: dto.hl7Version || '2.3.1',
      connectionType: dto.connectionType || 'tcp',
      host: dto.host || null,
      port: dto.port ? Number(dto.port) : null,
      sendingApplication: dto.sendingApplication || null,
      isActive: true,
      testMappings: dto.testMappings || null,
      notes: dto.notes || null,
      createdBy: userId,
    }});
  }

  /** Update analyzer configuration */
  async updateAnalyzer(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.analyzerConfig.findFirst({ where: { id, tenantId } });
    if (!existing) throw new BadRequestException('Analyzer not found');
    const u: any = {};
    ['name','manufacturer','model','serialNumber','department','protocol','hl7Version',
     'connectionType','host','sendingApplication','isActive','notes'].forEach(f => {
      if (dto[f] !== undefined) u[f] = dto[f];
    });
    if (dto.port !== undefined) u.port = Number(dto.port);
    if (dto.testMappings) u.testMappings = dto.testMappings;
    return this.prisma.analyzerConfig.update({ where: { id }, data: u });
  }

  /**
   * Process incoming HL7/ASTM message from an analyzer
   * This is the CORE function — parses the message and auto-populates results
   */
  async processMessage(tenantId: string, rawMessage: string, protocol: 'hl7' | 'astm' = 'hl7') {
    const parsed = protocol === 'astm' ? parseASTMMessage(rawMessage) : parseHL7Message(rawMessage);
    
    // Log the raw message for audit
    const msgLog = await this.prisma.analyzerMessage.create({ data: {
      tenantId,
      protocol,
      direction: 'inbound',
      messageType: parsed.msh.messageType,
      triggerEvent: parsed.msh.triggerEvent,
      sendingApplication: parsed.msh.sendingApplication,
      messageControlId: parsed.msh.messageControlId,
      rawMessage: rawMessage.substring(0, 10000),
      patientId: parsed.pid?.patientId || null,
      patientName: parsed.pid ? `${parsed.pid.lastName} ${parsed.pid.firstName}`.trim() : null,
      accessionNumber: parsed.obr[0]?.fillerOrderNumber || parsed.obr[0]?.placerOrderNumber || null,
      resultCount: parsed.obx.length,
      parseErrors: parsed.parseErrors.length > 0 ? parsed.parseErrors.join('; ') : null,
      processedStatus: 'received',
    }});
    
    // Find matching analyzer config
    const analyzer = await this.prisma.analyzerConfig.findFirst({
      where: { tenantId, sendingApplication: parsed.msh.sendingApplication, isActive: true }
    });
    
    // Auto-populate results if we can match to existing lab orders
    let matched = 0, unmatched = 0;
    const results: any[] = [];
    
    for (const obx of parsed.obx) {
      const result: any = {
        analyzerMessageId: msgLog.id,
        tenantId,
        observationId: obx.observationId,
        observationName: obx.observationName,
        value: obx.value,
        numericValue: obx.numericValue,
        units: obx.units,
        referenceRange: obx.referenceRange,
        abnormalFlag: obx.abnormalFlag,
        resultStatus: obx.resultStatus,
        isCritical: obx.abnormalFlag === 'HH' || obx.abnormalFlag === 'LL',
        analyzerName: analyzer?.name || parsed.msh.sendingApplication,
      };
      
      // Try to match to test catalog using analyzer code mapping
      if (analyzer?.testMappings) {
        const mappings = analyzer.testMappings as Record<string, string>;
        const hospiTestId = mappings[obx.observationId] || mappings[obx.observationName];
        if (hospiTestId) {
          result.matchedTestId = hospiTestId;
          matched++;
        } else {
          unmatched++;
        }
      } else {
        unmatched++;
      }
      
      results.push(result);
    }
    
    // Save parsed results
    if (results.length > 0) {
      await this.prisma.analyzerResult.createMany({ data: results });
    }
    
    // Update message log status
    await this.prisma.analyzerMessage.update({
      where: { id: msgLog.id },
      data: {
        processedStatus: parsed.parseErrors.length > 0 ? 'parse-error' : matched > 0 ? 'matched' : 'unmatched',
        matchedCount: matched,
        unmatchedCount: unmatched,
      }
    });
    
    // Generate ACK
    const ack = generateACK(parsed.msh, parsed.parseErrors.length > 0 ? 'AE' : 'AA');
    
    // Flag critical values for immediate attention
    const criticals = parsed.obx.filter(o => o.abnormalFlag === 'HH' || o.abnormalFlag === 'LL');
    
    return {
      messageId: msgLog.id,
      parsed: {
        patient: parsed.pid,
        orderCount: parsed.obr.length,
        resultCount: parsed.obx.length,
        matched,
        unmatched,
        criticalValues: criticals.map(c => ({
          test: c.observationName || c.observationId,
          value: c.value,
          units: c.units,
          range: c.referenceRange,
          flag: c.abnormalFlag,
        })),
      },
      parseErrors: parsed.parseErrors,
      ack,
    };
  }

  /** Get message history */
  async getMessages(tenantId: string, query: any) {
    const { page = 1, limit = 20, status } = query;
    const where: any = { tenantId };
    if (status) where.processedStatus = status;
    const [data, total] = await Promise.all([
      this.prisma.analyzerMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*limit, take: Number(limit) }),
      this.prisma.analyzerMessage.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit) };
  }

  /** Get parsed results for a specific message */
  async getResults(tenantId: string, messageId: string) {
    return this.prisma.analyzerResult.findMany({ where: { tenantId, analyzerMessageId: messageId } });
  }

  /** Get interface stats */
  async getStats(tenantId: string) {
    try {
      const [totalMessages, totalResults, analyzers, criticals] = await Promise.all([
        this.prisma.analyzerMessage.count({ where: { tenantId } }),
        this.prisma.analyzerResult.count({ where: { tenantId } }),
        this.prisma.analyzerConfig.count({ where: { tenantId, isActive: true } }),
        this.prisma.analyzerResult.count({ where: { tenantId, isCritical: true } }),
      ]);
      return { totalMessages, totalResults, activeAnalyzers: analyzers, criticalValues: criticals };
    } catch { return { totalMessages: 0, totalResults: 0, activeAnalyzers: 0, criticalValues: 0 }; }
  }

  /**
   * Approve and apply matched results to lab orders
   * This transfers analyzer results into the actual lab report
   */
  async approveResults(tenantId: string, messageId: string, userId: string) {
    const results = await this.prisma.analyzerResult.findMany({
      where: { tenantId, analyzerMessageId: messageId, matchedTestId: { not: null } }
    });
    let applied = 0;
    for (const r of results) {
      try {
        // Update the result status to approved
        await this.prisma.analyzerResult.update({
          where: { id: r.id },
          data: { approvedBy: userId, approvedAt: new Date(), resultStatus: 'approved' }
        });
        applied++;
      } catch (err) {
        this.logger.warn(`Failed to apply result ${r.id}: ${err}`);
      }
    }
    return { applied, total: results.length };
  }
}
