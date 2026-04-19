import { Module } from '@nestjs/common';
import { DicomViewerController } from './dicom-viewer.controller';
import { DicomViewerService } from './dicom-viewer.service';

@Module({
  controllers: [DicomViewerController],
  providers: [DicomViewerService],
  exports: [DicomViewerService],
})
export class DicomViewerModule {}
