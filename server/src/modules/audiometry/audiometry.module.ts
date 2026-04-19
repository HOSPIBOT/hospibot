import { Module } from '@nestjs/common';
import { AudiometryController } from './audiometry.controller';
import { AudiometryService } from './audiometry.service';

@Module({
  controllers: [AudiometryController],
  providers: [AudiometryService],
  exports: [AudiometryService],
})
export class AudiometryModule {}
