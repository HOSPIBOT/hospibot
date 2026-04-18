import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  // Export so DiagnosticModule can inject ComplianceService into DiagnosticService
  // for the assertCanReleaseReport call in signAndRelease.
  exports: [ComplianceService],
})
export class ComplianceModule {}
