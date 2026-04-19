import { Module } from '@nestjs/common';
import { FraxController } from './frax.controller';
import { FraxService } from './frax.service';

@Module({
  controllers: [FraxController],
  providers: [FraxService],
  exports: [FraxService],
})
export class FraxModule {}
