import { Controller, Get, Patch, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CommunicationsService } from './communications.service';

@Controller('super-admin/communications')
@UseGuards(JwtAuthGuard)
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  /** GET /super-admin/communications — all channel configs */
  @Get() async getAll() { return this.service.getAllConfigs(); }

  /** GET /super-admin/communications/providers — available providers per channel */
  @Get('providers') getProviders() { return this.service.getAvailableProviders(); }

  /** GET /super-admin/communications/pricing — pricing summary with margins */
  @Get('pricing') async getPricing() { return this.service.getPricingSummary(); }

  /** GET /super-admin/communications/:channel — single channel config */
  @Get(':channel') async getOne(@Param('channel') channel: string) { return this.service.getConfig(channel); }

  /** PATCH /super-admin/communications/:channel — update provider/credentials/pricing */
  @Patch(':channel') async update(@Param('channel') channel: string, @Body() dto: any, @Req() req: any) {
    return this.service.updateConfig(channel, dto, req.user?.id || 'admin');
  }

  /** POST /super-admin/communications/:channel/test — test provider connection */
  @Post(':channel/test') async test(@Param('channel') channel: string) { return this.service.testProvider(channel); }

  /** POST /super-admin/communications/seed — seed default configs */
  @Post('seed') async seed() { return this.service.seedDefaults(); }
}
