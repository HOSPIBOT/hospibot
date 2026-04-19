import { Module } from '@nestjs/common';
import { ConsultScheduleController } from './consult-schedule.controller';
import { ConsultScheduleService } from './consult-schedule.service';

@Module({
  controllers: [ConsultScheduleController],
  providers: [ConsultScheduleService],
  exports: [ConsultScheduleService],
})
export class ConsultScheduleModule {}
