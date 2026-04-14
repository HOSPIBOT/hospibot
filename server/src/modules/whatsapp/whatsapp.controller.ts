import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, Res, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto, SendTemplateDto, AssignConversationDto } from './dto/whatsapp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private whatsappService: WhatsappService,
    private config: ConfigService,
  ) {}

  // ==========================================
  // WEBHOOK ENDPOINTS (No auth - called by Meta)
  // ==========================================

  /**
   * Webhook verification (GET) - Meta sends this to verify your endpoint
   */
  @Get('webhook')
  @ApiExcludeEndpoint()
  verifyWebhook(@Req() req: Request, @Res() res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = this.config.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'hospibot-webhook-verify');

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp webhook verified');
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Forbidden');
  }

  /**
   * Webhook receiver (POST) - Meta sends messages here
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async receiveWebhook(@Body() body: any) {
    // Always respond 200 immediately (Meta requires this within 5 seconds)
    // Process asynchronously
    setImmediate(() => {
      this.whatsappService.processWebhook(body).catch((err) => {
        console.error('Webhook processing error:', err);
      });
    });

    return { status: 'received' };
  }

  // ==========================================
  // AUTHENTICATED ENDPOINTS (Staff dashboard)
  // ==========================================

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a text message to a phone number' })
  async sendMessage(@CurrentTenant() tenantId: string, @Body() dto: SendMessageDto) {
    if (dto.mediaUrl && dto.mediaType) {
      return this.whatsappService.sendMediaMessage(tenantId, dto.to, dto.mediaUrl, dto.mediaType, dto.message);
    }
    return this.whatsappService.sendTextMessage(tenantId, dto.to, dto.message);
  }

  @Post('send-template')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a template message (appointment reminders, etc.)' })
  async sendTemplate(@CurrentTenant() tenantId: string, @Body() dto: SendTemplateDto) {
    return this.whatsappService.sendTemplateMessage(
      tenantId, dto.to, dto.templateName, dto.language || 'en', dto.components || [],
    );
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get WhatsApp inbox - list of conversations' })
  async getConversations(
    @CurrentTenant() tenantId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('limit') limit?: string,
  ) {
    return this.whatsappService.getConversations(tenantId, {
      unreadOnly: unreadOnly === 'true',
      assignedTo,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages in a conversation' })
  async getMessages(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.whatsappService.getMessages(tenantId, conversationId, limit ? parseInt(limit) : 50, before);
  }

  @Put('conversations/:id/assign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign conversation to a staff member' })
  async assignConversation(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
    @Body() dto: AssignConversationDto,
  ) {
    return this.whatsappService.assignConversation(tenantId, conversationId, dto.assignTo, dto.department);
  }

  @Put('conversations/:id/bot')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch conversation back to bot handling' })
  async switchToBot(@CurrentTenant() tenantId: string, @Param('id') conversationId: string) {
    return this.whatsappService.switchToBot(tenantId, conversationId);
  }

// ==========================================
  // TEMPLATE MANAGEMENT
  // ==========================================

  @Get('templates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List WhatsApp templates for this tenant (or global defaults)' })
  async getTemplates(
    @CurrentTenant() tenantId: string,
    @Query('global') globalOnly?: string,
  ) {
    const where = globalOnly === 'true' ? { tenantId: null, isDefault: true } : {
      OR: [{ tenantId }, { isDefault: true, tenantId: null }],
    };
    const templates = await this.whatsappService['prisma'].whatsappTemplate.findMany({
      where,
      orderBy: { category: 'asc' },
    });
    return { data: templates };
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create / seed a WhatsApp template' })
  async createTemplate(@CurrentTenant() tenantId: string, @Body() body: any) {
    const template = await this.whatsappService['prisma'].whatsappTemplate.upsert({
      where: { name_tenantId: { name: body.name, tenantId: body.isDefault ? null : tenantId } },
      create: {
        name: body.name, displayName: body.displayName, category: body.category,
        bodyText: body.bodyText, headerText: body.headerText, footerText: body.footerText,
        buttons: body.buttons || [], variables: body.variables || [],
        isDefault: body.isDefault || false,
        tenantId: body.isDefault ? null : tenantId,
        status: 'PENDING',
      },
      update: { displayName: body.displayName, bodyText: body.bodyText, buttons: body.buttons || [] },
    });
    return template;
  }

  @Post('templates/seed-defaults')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed all default platform templates' })
  async seedDefaultTemplates() {
    // Seeds are handled by the seed.ts file at startup
    return { seeded: true, message: 'Default templates are seeded via database seed file' };
  }
}