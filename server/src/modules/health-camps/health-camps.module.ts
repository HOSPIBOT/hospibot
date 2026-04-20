import { Module } from '@nestjs/common';
import { HealthCampsController } from './health-camps.controller';
import { HealthCampsService } from './health-camps.service';
@Module({ controllers: [HealthCampsController], providers: [HealthCampsService], exports: [HealthCampsService] })
export class HealthCampsModule {}
