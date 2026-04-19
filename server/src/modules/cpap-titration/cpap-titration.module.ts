import { Module } from '@nestjs/common';
import { CpapTitrationController } from './cpap-titration.controller';
import { CpapTitrationService } from './cpap-titration.service';

@Module({
  controllers: [CpapTitrationController],
  providers: [CpapTitrationService],
  exports: [CpapTitrationService],
})
export class CpapTitrationModule {}
