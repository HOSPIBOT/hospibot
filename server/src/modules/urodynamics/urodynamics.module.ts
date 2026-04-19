import { Module } from '@nestjs/common';
import { UrodynamicsController } from './urodynamics.controller';
import { UrodynamicsService } from './urodynamics.service';

@Module({
  controllers: [UrodynamicsController],
  providers: [UrodynamicsService],
  exports: [UrodynamicsService],
})
export class UrodynamicsModule {}
