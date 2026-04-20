import { Module } from '@nestjs/common';
import { FundusPhotoController } from './fundus-photo.controller';
import { FundusPhotoService } from './fundus-photo.service';
@Module({ controllers: [FundusPhotoController], providers: [FundusPhotoService], exports: [FundusPhotoService] })
export class FundusPhotoModule {}
