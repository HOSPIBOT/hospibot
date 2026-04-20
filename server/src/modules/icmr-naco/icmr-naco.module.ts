import { Module } from '@nestjs/common';
import { IcmrNacoController } from './icmr-naco.controller';
import { IcmrNacoService } from './icmr-naco.service';

@Module({
  controllers: [IcmrNacoController],
  providers: [IcmrNacoService],
  exports: [IcmrNacoService],
})
export class IcmrNacoModule {}
