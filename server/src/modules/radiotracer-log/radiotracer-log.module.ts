import { Module } from '@nestjs/common';
import { RadiotracerLogController } from './radiotracer-log.controller';
import { RadiotracerLogService } from './radiotracer-log.service';

@Module({
  controllers: [RadiotracerLogController],
  providers: [RadiotracerLogService],
  exports: [RadiotracerLogService],
})
export class RadiotracerLogModule {}
