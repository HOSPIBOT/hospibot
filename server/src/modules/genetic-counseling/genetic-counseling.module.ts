import { Module } from '@nestjs/common';
import { GeneticCounselingController } from './genetic-counseling.controller';
import { GeneticCounselingService } from './genetic-counseling.service';

@Module({
  controllers: [GeneticCounselingController],
  providers: [GeneticCounselingService],
  exports: [GeneticCounselingService],
})
export class GeneticCounselingModule {}
