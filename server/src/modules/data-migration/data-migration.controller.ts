import { Controller, Post, Body, Req, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { DataMigrationService } from './data-migration.service';
@Controller('data-migration')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DataMigrationController {
  constructor(private readonly service: DataMigrationService) {}
  @Post('import/test-catalog') async importTestCatalog(@Req() req: any, @Body() dto: { rows: any[] }) { return this.service.importTestCatalog(req.tenantId, dto.rows); }
  @Post('import/patients') async importPatients(@Req() req: any, @Body() dto: { rows: any[] }) { return this.service.importPatients(req.tenantId, dto.rows); }
  @Post('import/doctors') async importDoctors(@Req() req: any, @Body() dto: { rows: any[] }) { return this.service.importDoctors(req.tenantId, dto.rows); }
  @Post('import/rate-cards') async importRateCards(@Req() req: any, @Body() dto: { rows: any[] }) { return this.service.importRateCards(req.tenantId, dto.rows); }
}
