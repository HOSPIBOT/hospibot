import { Module } from '@nestjs/common';
import { WmdaSyncController } from './wmda-sync.controller';
import { WmdaSyncService } from './wmda-sync.service';

@Module({
  controllers: [WmdaSyncController],
  providers: [WmdaSyncService],
  exports: [WmdaSyncService],
})
export class WmdaSyncModule {}
