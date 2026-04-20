import { Module } from '@nestjs/common';
import { ImmunotherapyController } from './immunotherapy.controller';
import { ImmunotherapyService } from './immunotherapy.service';
@Module({ controllers: [ImmunotherapyController], providers: [ImmunotherapyService], exports: [ImmunotherapyService] })
export class ImmunotherapyModule {}
