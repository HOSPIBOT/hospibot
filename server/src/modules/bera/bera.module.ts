import { Module } from '@nestjs/common';
import { BeraController } from './bera.controller';
import { BeraService } from './bera.service';

@Module({
  controllers: [BeraController],
  providers: [BeraService],
  exports: [BeraService],
})
export class BeraModule {}
