import { Module } from '@nestjs/common';
import { PartnerLabsController } from './partner-labs.controller';
import { PartnerLabsService } from './partner-labs.service';

@Module({
  controllers: [PartnerLabsController],
  providers: [PartnerLabsService],
  exports: [PartnerLabsService],
})
export class PartnerLabsModule {}
