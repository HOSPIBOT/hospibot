import { Module } from '@nestjs/common';
import { OphthalmicDiagnosticsController } from './ophthalmic-diagnostics.controller';
import { OphthalmicDiagnosticsService } from './ophthalmic-diagnostics.service';
@Module({ controllers: [OphthalmicDiagnosticsController], providers: [OphthalmicDiagnosticsService], exports: [OphthalmicDiagnosticsService] })
export class OphthalmicDiagnosticsModule {}
