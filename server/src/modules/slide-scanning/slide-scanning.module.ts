import { Module } from '@nestjs/common';
import { SlideScanningController } from './slide-scanning.controller';
import { SlideScanningService } from './slide-scanning.service';

@Module({
  controllers: [SlideScanningController],
  providers: [SlideScanningService],
  exports: [SlideScanningService],
})
export class SlideScanningModule {}
