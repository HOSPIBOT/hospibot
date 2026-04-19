import { Module } from '@nestjs/common';
import { HlaTypingController } from './hla-typing.controller';
import { HlaTypingService } from './hla-typing.service';

@Module({
  controllers: [HlaTypingController],
  providers: [HlaTypingService],
  exports: [HlaTypingService],
})
export class HlaTypingModule {}
