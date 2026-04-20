import {
  Controller, Get, Post, Patch, Put, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TierGuard } from '../../common/guards/tier.guard';
import { RequireFeature } from '../../common/decorators/tier.decorator';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticBillingService } from './diagnostic-billing.service';
import { DiagnosticReportService } from './diagnostic-report.service';
import {
  CreateOrderDto, UpdateOrderStatusDto, ListOrdersDto,
  CollectSampleDto, DispatchSampleDto, ReceiveSampleDto, RejectSampleDto,
  SubmitResultsDto, ValidateResultDto, SignReportDto, AmendReportDto,
  CreateHomeCollectionDto, AssignAgentDto, AgentCheckinDto, CollectionCheckoutDto,
  CreateTestDto, CreatePackageDto,
  CreateDoctorCRMDto, CreateCorporateClientDto,
  CreateQcResultDto, CreateReagentDto, AdjustStockDto,
  CreateAutomationRuleDto,
  CreateRechargeOrderDto, VerifyPaymentDto, AutoRechargeConfigDto,
} from './dto/diagnostic.dto';

@ApiTags('Diagnostic')
@Controller('diagnostic')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class DiagnosticController {
  constructor(
    private svc: DiagnosticService,
    private billing: DiagnosticBillingService,
    private reports: DiagnosticReportService,
  ) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Lab dashboard KPIs' })
  getDashboard(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.svc.getDashboard(tenantId, branchId);
  }

  @Get('dashboard/trend')
  getTrend(@CurrentTenant() tenantId: string, @Query('days') days = 14) {
    return this.svc.getOrderTrend(tenantId, +days);
  }

  // ── Lab Orders ────────────────────────────────────────────────────────────

  @Post('orders')
  @ApiOperation({ summary: 'Create lab order (patient registration + test selection)' })
  createOrder(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateOrderDto,
  ) {
    return this.svc.createOrder(tenantId, user.branchId, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List orders with filters — worklist view' })
  listOrders(@CurrentTenant() tenantId: string, @Query() filters: ListOrdersDto) {
    return this.svc.listOrders(tenantId, filters);
  }

  @Get('orders/worklist')
  @ApiOperation({ summary: 'Technician/pathologist worklist' })
  getWorklist(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Query('department') department?: string,
  ) {
    return this.svc.getWorklist(tenantId, { department, branchId: user.branchId, userId: user.id });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get full order detail with items, samples, results' })
  getOrder(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.getOrder(tenantId, id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Advance order status (8-stage lifecycle)' })
  updateStatus(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.svc.updateOrderStatus(tenantId, id, user.id, dto);
  }

  // ── Samples ───────────────────────────────────────────────────────────────

  @Patch('orders/:id/collect')
  @ApiOperation({ summary: 'Mark sample collected + print barcode' })
  collectSample(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: CollectSampleDto,
  ) {
    return this.svc.collectSample(tenantId, orderId, user.id, dto);
  }

  @Post('samples/dispatch')
  @ApiOperation({ summary: 'Dispatch batch of samples to lab (runner barcode scan)' })
  dispatchSamples(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: DispatchSampleDto,
  ) {
    return this.svc.dispatchSamples(tenantId, user.id, dto);
  }

  @Post('samples/receive')
  @ApiOperation({ summary: 'Receive samples at lab' })
  receiveSamples(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: ReceiveSampleDto,
  ) {
    return this.svc.receiveSamples(tenantId, user.id, dto);
  }

  @Post('samples/reject')
  @ApiOperation({ summary: 'Reject sample with reason' })
  rejectSample(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: RejectSampleDto,
  ) {
    return this.svc.rejectSample(tenantId, user.id, dto);
  }

  // ── Result Entry ──────────────────────────────────────────────────────────

  @Post('orders/:id/results')
  @ApiOperation({ summary: 'Enter/update results for order items' })
  submitResults(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: SubmitResultsDto,
  ) {
    return this.svc.submitResults(tenantId, orderId, user.id, dto);
  }

  @Patch('results/:resultId/validate')
  @ApiOperation({ summary: 'Level-1 validate a result entry (Supervisor)' })
  validateResult(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('resultId') resultId: string,
    @Query('orderId') orderId: string,
    @Body() dto: ValidateResultDto,
  ) {
    return this.svc.validateResult(tenantId, orderId, user.id, { ...dto, resultEntryId: resultId });
  }

  @Post('orders/:id/sign')
  @ApiOperation({ summary: 'Pathologist digital sign-off + report release (T05/T06)' })
  signAndRelease(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: SignReportDto,
  ) {
    return this.svc.signAndRelease(tenantId, orderId, user.id, dto);
  }

  @Post('orders/:id/amend')
  @ApiOperation({ summary: 'Amend released report (creates new version)' })
  amendReport(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: AmendReportDto,
  ) {
    return this.svc.amendReport(tenantId, orderId, user.id, dto);
  }

  // ── Home Collection ───────────────────────────────────────────────────────

  @Post('home-collections')
  @ApiOperation({ summary: 'Book home collection slot' })
  createHomeCollection(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateHomeCollectionDto,
  ) {
    return this.svc.createHomeCollection(tenantId, user.id, dto);
  }

  @Get('home-collections')
  @ApiOperation({ summary: 'List home collections (coordinator view)' })
  listHomeCollections(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.svc.listHomeCollections(tenantId, filters);
  }

  @Patch('home-collections/:id/assign')
  @ApiOperation({ summary: 'Assign agent to home collection' })
  assignAgent(
    @CurrentTenant() tenantId: string,
    @Param('id') collectionId: string,
    @Body() dto: AssignAgentDto,
  ) {
    return this.svc.assignAgent(tenantId, collectionId, dto);
  }

  @Patch('home-collections/:id/checkin')
  @ApiOperation({ summary: 'Agent GPS check-in at patient location' })
  agentCheckin(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') collectionId: string,
    @Body() dto: AgentCheckinDto,
  ) {
    return this.svc.agentCheckin(tenantId, collectionId, user.id, dto);
  }

  @Patch('home-collections/:id/collect')
  @ApiOperation({ summary: 'Agent marks samples collected + uploads photo' })
  collectionCheckout(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') collectionId: string,
    @Body() dto: CollectionCheckoutDto,
  ) {
    return this.svc.collectionCheckout(tenantId, collectionId, user.id, dto);
  }

  // ── Test Catalog ──────────────────────────────────────────────────────────

  @Get('catalog')
  @ApiOperation({ summary: 'Get test catalog (grouped by category)' })
  listCatalog(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.svc.listCatalog(tenantId, search, category);
  }

  @Post('catalog')
  @ApiOperation({ summary: 'Add test to catalog with reference ranges' })
  createTest(@CurrentTenant() tenantId: string, @Body() dto: CreateTestDto) {
    return this.svc.createTest(tenantId, dto);
  }

  @Put('catalog/:id')
  @ApiOperation({ summary: 'Update test (price, TAT, reference ranges)' })
  updateTest(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: Partial<CreateTestDto>) {
    return this.svc.updateTest(tenantId, id, dto);
  }

  @Delete('catalog/:id')
  @ApiOperation({ summary: 'Deactivate test from catalog (soft delete)' })
  deleteTest(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.deleteTest(tenantId, id);
  }

  @Post('catalog/seed')
  @ApiOperation({ summary: 'Seed 25 default tests into catalog' })
  seedCatalog(@CurrentTenant() tenantId: string) {
    return this.svc.seedDefaultCatalog(tenantId);
  }

  // ── Doctor CRM ────────────────────────────────────────────────────────────

  @Get('crm/doctors')
  @ApiOperation({ summary: 'List referring doctors with referral stats' })
  listDoctors(@CurrentTenant() tenantId: string, @Query('search') search?: string) {
    return this.svc.listDoctors(tenantId, search);
  }

  @Post('crm/doctors')
  @ApiOperation({ summary: 'Add doctor to CRM' })
  createDoctor(@CurrentTenant() tenantId: string, @Body() dto: CreateDoctorCRMDto) {
    return this.svc.createDoctor(tenantId, dto);
  }

  @Put('crm/doctors/:id')
  @ApiOperation({ summary: 'Update doctor CRM record' })
  updateDoctor(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateDoctorCRMDto>,
  ) {
    return this.svc.updateDoctor(tenantId, id, dto);
  }

  @Get('crm/doctors/:id/stats')
  @ApiOperation({ summary: 'Doctor referral analytics' })
  getDoctorStats(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.getDoctorStats(tenantId, id);
  }

  // ── Corporate Clients (Medium tier and above) ───────────────────────────

  @Get('crm/corporates')
  @UseGuards(TierGuard)
  @RequireFeature('corporate-clients')
  @ApiOperation({ summary: 'List corporate wellness clients (Medium+)' })
  listCorporates(@CurrentTenant() tenantId: string) {
    return this.svc.listCorporates(tenantId);
  }

  @Post('crm/corporates')
  @UseGuards(TierGuard)
  @RequireFeature('corporate-clients')
  @ApiOperation({ summary: 'Add corporate client (Medium+)' })
  createCorporate(@CurrentTenant() tenantId: string, @Body() dto: CreateCorporateClientDto) {
    return this.svc.createCorporate(tenantId, dto);
  }

  // ── Reagent Inventory (Large tier and above) ────────────────────────────

  @Get('inventory/reagents')
  @UseGuards(TierGuard)
  @RequireFeature('inventory-reagents')
  @ApiOperation({ summary: 'Reagent stock with expiry alerts (Large+)' })
  listReagents(@CurrentTenant() tenantId: string) {
    return this.svc.listReagents(tenantId);
  }

  @Post('inventory/reagents')
  @UseGuards(TierGuard)
  @RequireFeature('inventory-reagents')
  @ApiOperation({ summary: 'Add reagent to inventory (Large+)' })
  createReagent(@CurrentTenant() tenantId: string, @Body() dto: CreateReagentDto) {
    return this.svc.createReagent(tenantId, dto);
  }

  @Patch('inventory/reagents/:id/stock')
  @ApiOperation({ summary: 'Adjust reagent stock (receive/use/discard)' })
  adjustStock(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.svc.adjustStock(tenantId, id, user.id, dto);
  }

  // ── QC (Large tier and above — Westgard + Levey-Jennings) ───────────────

  @Post('qc/results')
  @UseGuards(TierGuard)
  @RequireFeature('qc-westgard')
  @ApiOperation({ summary: 'Submit QC run result + auto Westgard evaluation (Large+)' })
  submitQc(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateQcResultDto,
  ) {
    return this.svc.submitQcResult(tenantId, user.id, dto);
  }

  @Get('qc/history/:testCode')
  @UseGuards(TierGuard)
  @RequireFeature('qc-westgard')
  @ApiOperation({ summary: 'QC history + Levey-Jennings chart data (Large+)' })
  getQcHistory(
    @CurrentTenant() tenantId: string,
    @Param('testCode') testCode: string,
    @Query('days') days = 30,
  ) {
    return this.svc.getQcHistory(tenantId, testCode, +days);
  }

  // ── Revenue Engine ────────────────────────────────────────────────────────

  @Get('automation/rules')
  @ApiOperation({ summary: 'List automation rules with performance stats' })
  listRules(@CurrentTenant() tenantId: string) {
    return this.svc.listAutomationRules(tenantId);
  }

  @Post('automation/rules')
  @ApiOperation({ summary: 'Create automation rule (re-test reminder)' })
  createRule(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateAutomationRuleDto,
  ) {
    return this.svc.createAutomationRule(tenantId, user.id, dto);
  }

  @Patch('automation/rules/:id/toggle')
  @ApiOperation({ summary: 'Toggle automation rule on/off' })
  toggleRule(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.svc.toggleRule(tenantId, id);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  @Get('analytics')
  @ApiOperation({ summary: 'Full analytics (revenue, TAT, orders, automation ROI)' })
  getAnalytics(
    @CurrentTenant() tenantId: string,
    @Query('period') period: '7d' | '30d' | '90d' | '365d' = '30d',
  ) {
    return this.svc.getAnalytics(tenantId, period);
  }

  // ── Billing & Wallet ──────────────────────────────────────────────────────

  @Get('billing/overview')
  @ApiOperation({ summary: 'Wallet balances + plan + renewal info' })
  getWalletOverview(@CurrentTenant() tenantId: string) {
    return this.svc.getWalletOverview(tenantId);
  }

  @Get('billing/usage/:walletType')
  @ApiOperation({ summary: 'Granular usage breakdown (WhatsApp/SMS/Storage)' })
  getUsage(
    @CurrentTenant() tenantId: string,
    @Param('walletType') walletType: string,
    @Query('period') period = '30d',
  ) {
    return this.svc.getWalletUsage(tenantId, walletType, period);
  }

  @Get('billing/packs/:type')
  @ApiOperation({ summary: 'Available recharge packs for a wallet type' })
  getRechargePacks(@Param('type') type: string) {
    return this.svc.getRechargePacks(type);
  }

  @Get('billing/invoices')
  @ApiOperation({ summary: 'HospiBot invoice history (subscription + top-ups)' })
  getInvoices(
    @CurrentTenant() tenantId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.getInvoices(tenantId, +page, +limit);
  }

  @Get('billing/transactions')
  @ApiOperation({ summary: 'All wallet transactions (every debit/credit)' })
  getTransactions(
    @CurrentTenant() tenantId: string,
    @Query('walletType') walletType?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.svc.getWalletTransactions(tenantId, walletType, +page, +limit);
  }

  // ── Razorpay Webhook (public — no auth) ──────────────────────────────────

  @Post('billing/webhook/razorpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay payment webhook (signed)' })
  handleWebhook(@Body() payload: any, @Req() req: any) {
    const sig = req.headers['x-razorpay-signature'] ?? '';
    return this.billing.handleWebhook(payload, sig);
  }

  @Post('billing/recharge')
  @ApiOperation({ summary: 'Create Razorpay order for wallet recharge' })
  createRechargeOrder(
    @CurrentTenant() tenantId: string,
    @Body() dto: { packId: string },
  ) {
    return this.billing.createRechargeOrder(tenantId, dto.packId);
  }

  @Post('billing/verify-payment')
  @ApiOperation({ summary: 'Verify Razorpay payment and credit wallet' })
  verifyPayment(
    @CurrentTenant() tenantId: string,
    @Body() dto: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) {
    return this.billing.verifyPayment(tenantId, dto);
  }

  @Get('billing/auto-recharge')
  @ApiOperation({ summary: 'Get auto-recharge configuration' })
  getAutoRecharge(@CurrentTenant() tenantId: string) {
    return this.billing.getAutoRechargeConfig(tenantId);
  }

  @Patch('billing/auto-recharge')
  @ApiOperation({ summary: 'Configure auto-recharge' })
  setAutoRecharge(
    @CurrentTenant() tenantId: string,
    @Body() dto: { walletType: string; enabled: boolean; threshold?: number; packId?: string },
  ) {
    return this.billing.setAutoRechargeConfig(tenantId, dto);
  }

  @Post('billing/packs/seed')
  @ApiOperation({ summary: 'Seed default recharge packs (admin)' })
  seedPacks() {
    return this.billing.seedRechargePacks();
  }

  // ── Report Generation ─────────────────────────────────────────────────────

  @Post('orders/:id/generate-pdf')
  @ApiOperation({ summary: 'Generate PDF for a released lab report' })
  generatePdf(
    @CurrentTenant() tenantId: string,
    @Param('id') orderId: string,
  ) {
    return this.reports.generateAndUpload(tenantId, orderId);
  }

  @Get('orders/:id/report-html')
  @ApiOperation({ summary: 'Get report HTML (for inline preview)' })
  getReportHtml(
    @CurrentTenant() tenantId: string,
    @Param('id') orderId: string,
    @Query('token') token: string,
  ) {
    return this.reports.getReportHtml(tenantId, orderId, token);
  }

  // ── Equipment Log ─────────────────────────────────────────────────────────

  @Get('equipment')
  @ApiOperation({ summary: 'List equipment logs (calibration, maintenance, breakdowns)' })
  listEquipment(
    @CurrentTenant() tenantId: string,
    @Query('eventType') eventType?: string,
  ) {
    return this.svc.listEquipmentLogs(tenantId, eventType);
  }

  @Post('equipment')
  @ApiOperation({ summary: 'Log an equipment event' })
  createEquipmentLog(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.svc.createEquipmentLog(tenantId, user.id, dto);
  }

  // ── Health Packages ───────────────────────────────────────────────────────

  @Get('packages')
  @ApiOperation({ summary: 'List health check packages / bundles' })
  listPackages(@CurrentTenant() tenantId: string) {
    return this.svc.listPackages(tenantId);
  }

  @Post('packages')
  @ApiOperation({ summary: 'Create health check package' })
  createPackage(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.svc.createPackage(tenantId, dto);
  }

  @Put('packages/:id')
  @Patch('packages/:id')
  @ApiOperation({ summary: 'Update health check package' })
  updatePackage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.svc.updatePackage(tenantId, id, dto);
  }

  // ── Rate Cards ────────────────────────────────────────────────────────────

  @Get('rate-cards')
  @ApiOperation({ summary: 'List rate cards (walk-in, doctor, corporate, TPA)' })
  listRateCards(@CurrentTenant() tenantId: string) {
    return this.svc.listRateCards(tenantId);
  }

  @Post('rate-cards')
  @ApiOperation({ summary: 'Create rate card' })
  createRateCard(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.svc.createRateCard(tenantId, dto);
  }

  @Put('rate-cards/:id')
  @ApiOperation({ summary: 'Update rate card' })
  updateRateCard(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateRateCard(tenantId, id, dto);
  }

  @Post('automation/rules/seed')
  @ApiOperation({ summary: 'Seed 7 default Revenue Engine rules for this tenant' })
  seedAutomationRules(@CurrentTenant() tenantId: string) {
    return this.svc.seedDefaultAutomationRules(tenantId);
  }

  // ── Letterhead & Branding ─────────────────────────────────────────────────

  @Get('letterhead')
  @ApiOperation({ summary: 'Get report letterhead configuration' })
  getLetterhead(@CurrentTenant() tenantId: string) {
    return this.svc.getLetterheadConfig(tenantId);
  }

  @Patch('letterhead')
  @ApiOperation({ summary: 'Update report letterhead (logo, header, footer, colors, NABL cert)' })
  updateLetterhead(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.svc.updateLetterheadConfig(tenantId, dto);
  }
