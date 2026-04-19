import { Module } from '@nestjs/common';
import { ReadingWorklistController } from './reading-worklist.controller';
import { ReadingWorklistService } from './reading-worklist.service';

@Module({
  controllers: [ReadingWorklistController],
  providers: [ReadingWorklistService],
  exports: [ReadingWorklistService],
})
export class ReadingWorklistModule {}
