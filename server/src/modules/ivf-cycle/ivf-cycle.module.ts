import { Module } from '@nestjs/common';
import { IvfCycleController } from './ivf-cycle.controller';
import { IvfCycleService } from './ivf-cycle.service';

@Module({
  controllers: [IvfCycleController],
  providers: [IvfCycleService],
  exports: [IvfCycleService],
})
export class IvfCycleModule {}
