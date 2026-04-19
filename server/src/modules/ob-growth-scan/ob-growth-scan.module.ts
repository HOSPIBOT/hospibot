import { Module } from '@nestjs/common';
import { ObGrowthScanController } from './ob-growth-scan.controller';
import { ObGrowthScanService } from './ob-growth-scan.service';

@Module({
  controllers: [ObGrowthScanController],
  providers: [ObGrowthScanService],
  exports: [ObGrowthScanService],
})
export class ObGrowthScanModule {}
