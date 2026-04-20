import { Module } from '@nestjs/common';
import { DentalRadiologyController } from './dental-radiology.controller';
import { DentalRadiologyService } from './dental-radiology.service';
@Module({ controllers: [DentalRadiologyController], providers: [DentalRadiologyService], exports: [DentalRadiologyService] })
export class DentalRadiologyModule {}
