import { Module } from '@nestjs/common';
import { TmtStressController } from './tmt-stress.controller';
import { TmtStressService } from './tmt-stress.service';

@Module({
  controllers: [TmtStressController],
  providers: [TmtStressService],
  exports: [TmtStressService],
})
export class TmtStressModule {}
