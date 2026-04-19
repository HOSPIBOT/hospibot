import { Module } from '@nestjs/common';
import { RsoDashboardController } from './rso-dashboard.controller';
import { RsoDashboardService } from './rso-dashboard.service';

@Module({
  controllers: [RsoDashboardController],
  providers: [RsoDashboardService],
  exports: [RsoDashboardService],
})
export class RsoDashboardModule {}
