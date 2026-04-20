import { Module } from '@nestjs/common';
import { DtcGenomicsController } from './dtc-genomics.controller';
import { DtcGenomicsService } from './dtc-genomics.service';
@Module({ controllers: [DtcGenomicsController], providers: [DtcGenomicsService], exports: [DtcGenomicsService] })
export class DtcGenomicsModule {}
