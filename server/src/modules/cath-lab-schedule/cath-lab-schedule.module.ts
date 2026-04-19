import { Module } from '@nestjs/common';
import { CathLabScheduleController } from './cath-lab-schedule.controller';
import { CathLabScheduleService } from './cath-lab-schedule.service';

@Module({
  controllers: [CathLabScheduleController],
  providers: [CathLabScheduleService],
  exports: [CathLabScheduleService],
})
export class CathLabScheduleModule {}
