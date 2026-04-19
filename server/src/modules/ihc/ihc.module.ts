import { Module } from '@nestjs/common';
import { IhcController } from './ihc.controller';
import { IhcService } from './ihc.service';

@Module({
  controllers: [IhcController],
  providers: [IhcService],
  exports: [IhcService],
})
export class IhcModule {}
