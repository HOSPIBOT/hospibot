import { Module } from '@nestjs/common';
import { SlaMonitorController } from './sla-monitor.controller';
import { SlaMonitorService } from './sla-monitor.service';

@Module({
  controllers: [SlaMonitorController],
  providers: [SlaMonitorService],
  exports: [SlaMonitorService],
})
export class SlaMonitorModule {}
