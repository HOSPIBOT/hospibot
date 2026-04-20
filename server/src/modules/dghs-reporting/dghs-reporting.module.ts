import { Module } from '@nestjs/common';
import { DghsReportingController } from './dghs-reporting.controller';
import { DghsReportingService } from './dghs-reporting.service';
@Module({ controllers: [DghsReportingController], providers: [DghsReportingService], exports: [DghsReportingService] })
export class DghsReportingModule {}
