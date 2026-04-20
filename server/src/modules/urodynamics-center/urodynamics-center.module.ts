import { Module } from '@nestjs/common';
import { UrodynamicsCenterController } from './urodynamics-center.controller';
import { UrodynamicsCenterService } from './urodynamics-center.service';
@Module({ controllers: [UrodynamicsCenterController], providers: [UrodynamicsCenterService], exports: [UrodynamicsCenterService] })
export class UrodynamicsCenterModule {}
