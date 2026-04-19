import { Module } from '@nestjs/common';
import { ClientCentersController } from './client-centers.controller';
import { ClientCentersService } from './client-centers.service';

@Module({
  controllers: [ClientCentersController],
  providers: [ClientCentersService],
  exports: [ClientCentersService],
})
export class ClientCentersModule {}
