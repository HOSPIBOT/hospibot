import { Module } from '@nestjs/common';
import { ForensicToxicologyLabController } from './forensic-toxicology-lab.controller';
import { ForensicToxicologyLabService } from './forensic-toxicology-lab.service';
@Module({ controllers: [ForensicToxicologyLabController], providers: [ForensicToxicologyLabService], exports: [ForensicToxicologyLabService] })
export class ForensicToxicologyLabModule {}
