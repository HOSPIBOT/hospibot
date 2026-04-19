import { Module } from '@nestjs/common';
import { SpirometryController } from './spirometry.controller';
import { SpirometryService } from './spirometry.service';

@Module({
  controllers: [SpirometryController],
  providers: [SpirometryService],
  exports: [SpirometryService],
})
export class SpirometryModule {}
