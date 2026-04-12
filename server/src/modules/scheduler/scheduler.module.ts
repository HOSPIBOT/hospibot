import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { DatabaseModule } from '../../database/database.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [DatabaseModule, WhatsappModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
