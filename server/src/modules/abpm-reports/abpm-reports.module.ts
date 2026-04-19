import { Module } from '@nestjs/common';
import { AbpmReportsController } from './abpm-reports.controller';
import { AbpmReportsService } from './abpm-reports.service';

@Module({
  controllers: [AbpmReportsController],
  providers: [AbpmReportsService],
  exports: [AbpmReportsService],
})
export class AbpmReportsModule {}
