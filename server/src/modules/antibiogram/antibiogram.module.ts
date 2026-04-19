import { Module } from '@nestjs/common';
import { AntibiogramController } from './antibiogram.controller';
import { AntibiogramService } from './antibiogram.service';

@Module({
  controllers: [AntibiogramController],
  providers: [AntibiogramService],
  exports: [AntibiogramService],
})
export class AntibiogramModule {}
