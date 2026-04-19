import { Module } from '@nestjs/common';
import { AiScoringController } from './ai-scoring.controller';
import { AiScoringService } from './ai-scoring.service';

@Module({
  controllers: [AiScoringController],
  providers: [AiScoringService],
  exports: [AiScoringService],
})
export class AiScoringModule {}
