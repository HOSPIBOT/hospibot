import { Module } from '@nestjs/common';
import { TumorMarkersController } from './tumor-markers.controller';
import { TumorMarkersService } from './tumor-markers.service';

@Module({
  controllers: [TumorMarkersController],
  providers: [TumorMarkersService],
  exports: [TumorMarkersService],
})
export class TumorMarkersModule {}
