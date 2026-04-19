import { Module } from '@nestjs/common';
import { VideoCaptureController } from './video-capture.controller';
import { VideoCaptureService } from './video-capture.service';

@Module({
  controllers: [VideoCaptureController],
  providers: [VideoCaptureService],
  exports: [VideoCaptureService],
})
export class VideoCaptureModule {}
