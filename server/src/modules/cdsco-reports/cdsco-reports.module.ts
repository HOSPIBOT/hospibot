import { Module } from '@nestjs/common';
import { CdscoReportsController } from './cdsco-reports.controller';
import { CdscoReportsService } from './cdsco-reports.service';

@Module({
  controllers: [CdscoReportsController],
  providers: [CdscoReportsService],
  exports: [CdscoReportsService],
})
export class CdscoReportsModule {}
