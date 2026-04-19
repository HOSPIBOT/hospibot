import { Module } from '@nestjs/common';
import { WaveformsController } from './waveforms.controller';
import { WaveformsService } from './waveforms.service';

@Module({
  controllers: [WaveformsController],
  providers: [WaveformsService],
  exports: [WaveformsService],
})
export class WaveformsModule {}
