import { Module } from '@nestjs/common';
import { PopulationHealthController } from './population-health.controller';
import { PopulationHealthService } from './population-health.service';

@Module({
  controllers: [PopulationHealthController],
  providers: [PopulationHealthService],
  exports: [PopulationHealthService],
})
export class PopulationHealthModule {}
