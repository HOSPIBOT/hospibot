import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticBillingService } from './diagnostic-billing.service';
import { DiagnosticReportService } from './diagnostic-report.service';
import { DatabaseModule } from '../../database/database.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { TierGuard } from '../../common/guards/tier.guard';

@Module({
  imports: [DatabaseModule, WhatsappModule, ConfigModule],
  controllers: [DiagnosticController],
  providers: [DiagnosticService, DiagnosticBillingService, DiagnosticReportService, TierGuard],
  exports: [DiagnosticService, DiagnosticBillingService, DiagnosticReportService],
})
export class DiagnosticModule {}
