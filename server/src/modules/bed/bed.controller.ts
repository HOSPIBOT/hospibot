import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { BedService } from './bed.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('beds')
export class BedController {
  constructor(private readonly bedService: BedService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any, @Query('branchId') branchId?: string) {
    return this.bedService.getDashboard(req.user.tenantId, branchId);
  }

  @Get('wards')
  getWards(@Request() req: any, @Query('branchId') branchId?: string) {
    return this.bedService.getWards(req.user.tenantId, branchId);
  }

  @Get()
  getBeds(
    @Request() req: any,
    @Query('branchId') branchId?: string,
    @Query('ward') ward?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bedService.getBeds(req.user.tenantId, {
      branchId, ward, category, status,
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
    });
  }

  @Post()
  createBed(@Request() req: any, @Body() dto: any) {
    return this.bedService.createBed(req.user.tenantId, dto);
  }

  @Post('bulk')
  bulkCreate(@Request() req: any, @Body() dto: any) {
    return this.bedService.bulkCreate(req.user.tenantId, dto);
  }

  @Put(':id')
  updateBed(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.bedService.updateBed(req.user.tenantId, id, dto);
  }

  @Post(':id/admit')
  admitPatient(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.bedService.admitPatient(req.user.tenantId, id, dto);
  }

  @Post(':id/discharge')
  dischargePatient(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.bedService.dischargePatient(req.user.tenantId, id, dto);
  }

  @Patch(':id/available')
  markAvailable(@Request() req: any, @Param('id') id: string) {
    return this.bedService.markAvailable(req.user.tenantId, id);
  }
}
