import { Module } from '@nestjs/common';
import { GcMsController } from './gc-ms.controller';
import { GcMsService } from './gc-ms.service';

@Module({
  controllers: [GcMsController],
  providers: [GcMsService],
  exports: [GcMsService],
})
export class GcMsModule {}
