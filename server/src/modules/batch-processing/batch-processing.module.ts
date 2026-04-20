import { Module } from '@nestjs/common';
import { BatchProcessingController } from './batch-processing.controller';
import { BatchProcessingService } from './batch-processing.service';

@Module({
  controllers: [BatchProcessingController],
  providers: [BatchProcessingService],
  exports: [BatchProcessingService],
})
export class BatchProcessingModule {}
