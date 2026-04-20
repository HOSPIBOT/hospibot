import { Module } from '@nestjs/common';
import { StemCellHlaLabController } from './stem-cell-hla-lab.controller';
import { StemCellHlaLabService } from './stem-cell-hla-lab.service';
@Module({ controllers: [StemCellHlaLabController], providers: [StemCellHlaLabService], exports: [StemCellHlaLabService] })
export class StemCellHlaLabModule {}
