import { Module } from '@nestjs/common';
import { KitLogisticsController } from './kit-logistics.controller';
import { KitLogisticsService } from './kit-logistics.service';

@Module({
  controllers: [KitLogisticsController],
  providers: [KitLogisticsService],
  exports: [KitLogisticsService],
})
export class KitLogisticsModule {}
