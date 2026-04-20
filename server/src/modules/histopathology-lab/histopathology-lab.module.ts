import { Module } from '@nestjs/common';
import { HistopathologyLabController } from './histopathology-lab.controller';
import { HistopathologyLabService } from './histopathology-lab.service';
@Module({ controllers: [HistopathologyLabController], providers: [HistopathologyLabService], exports: [HistopathologyLabService] })
export class HistopathologyLabModule {}
