import { Module } from '@nestjs/common';
import { CrossmatchController } from './crossmatch.controller';
import { CrossmatchService } from './crossmatch.service';

@Module({
  controllers: [CrossmatchController],
  providers: [CrossmatchService],
  exports: [CrossmatchService],
})
export class CrossmatchModule {}
