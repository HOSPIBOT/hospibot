import { Module } from '@nestjs/common';
import { OctScansController } from './oct-scans.controller';
import { OctScansService } from './oct-scans.service';
@Module({ controllers: [OctScansController], providers: [OctScansService], exports: [OctScansService] })
export class OctScansModule {}
