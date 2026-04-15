import { Module } from '@nestjs/common';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticBillingService } from './diagnostic-billing.service';
import { DatabaseModule } from '../../database/database.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [DatabaseModule, WhatsappModule],
  controllers: [DiagnosticController],
  providers: [DiagnosticService, DiagnosticBillingService],
  exports: [DiagnosticService, DiagnosticBillingService],
})
export class DiagnosticModule {}
