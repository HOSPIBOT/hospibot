import { Module } from '@nestjs/common';
import { BarcReportingController } from './barc-reporting.controller';
import { BarcReportingService } from './barc-reporting.service';
@Module({ controllers: [BarcReportingController], providers: [BarcReportingService], exports: [BarcReportingService] })
export class BarcReportingModule {}
