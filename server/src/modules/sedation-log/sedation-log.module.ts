import { Module } from '@nestjs/common';
import { SedationLogController } from './sedation-log.controller';
import { SedationLogService } from './sedation-log.service';

@Module({
  controllers: [SedationLogController],
  providers: [SedationLogService],
  exports: [SedationLogService],
})
export class SedationLogModule {}
