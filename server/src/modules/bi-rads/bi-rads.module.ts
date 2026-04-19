import { Module } from '@nestjs/common';
import { BiRadsController } from './bi-rads.controller';
import { BiRadsService } from './bi-rads.service';

@Module({
  controllers: [BiRadsController],
  providers: [BiRadsService],
  exports: [BiRadsService],
})
export class BiRadsModule {}
