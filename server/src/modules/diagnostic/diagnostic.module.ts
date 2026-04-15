import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticBillingService } from './diagnostic-billing.service';
import { DiagnosticReportService } from './diagnostic-report.service';
import { DatabaseModule } from '../../database/database.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [DatabaseModule, WhatsappModule, ConfigModule],
  controllers: [DiagnosticController],
  providers: [DiagnosticService, DiagnosticBillingService, DiagnosticReportService],
  exports: [DiagnosticService, DiagnosticBillingService, DiagnosticReportService],
})
export class DiagnosticModule {}
