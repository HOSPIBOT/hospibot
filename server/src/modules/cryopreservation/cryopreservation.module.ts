import { Module } from '@nestjs/common';
import { CryopreservationController } from './cryopreservation.controller';
import { CryopreservationService } from './cryopreservation.service';

@Module({
  controllers: [CryopreservationController],
  providers: [CryopreservationService],
  exports: [CryopreservationService],
})
export class CryopreservationModule {}
