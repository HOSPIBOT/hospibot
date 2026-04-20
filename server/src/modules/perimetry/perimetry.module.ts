import { Module } from '@nestjs/common';
import { PerimetryController } from './perimetry.controller';
import { PerimetryService } from './perimetry.service';
@Module({ controllers: [PerimetryController], providers: [PerimetryService], exports: [PerimetryService] })
export class PerimetryModule {}
