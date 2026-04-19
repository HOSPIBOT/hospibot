import { Module } from '@nestjs/common';
import { RoutePlanningController } from './route-planning.controller';
import { RoutePlanningService } from './route-planning.service';

@Module({
  controllers: [RoutePlanningController],
  providers: [RoutePlanningService],
  exports: [RoutePlanningService],
})
export class RoutePlanningModule {}
