import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { PatientModule } from './modules/patient/patient.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { BillingModule } from './modules/billing/billing.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CrmModule } from './modules/crm/crm.module';
import { AutomationModule } from './modules/automation/automation.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthController } from './health.controller';
import { StartupService } from './startup.service';
import { DbBootstrapService } from './db-bootstrap.service';
import { HrmsModule } from './modules/hrms/hrms.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { PortalModule } from './modules/portal/portal.module';
import { ControlPlaneModule } from './modules/control-plane/control-plane.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { VaultModule } from './modules/vault/vault.module';
import { LabModule } from './modules/lab/lab.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { SecurityModule } from './modules/security/security.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { ColdChainModule } from './modules/cold-chain/cold-chain.module';
import { CultureModule } from './modules/culture/culture.module';
import { DonorModule } from './modules/donor/donor.module';
import { CrossmatchModule } from './modules/crossmatch/crossmatch.module';
import { PrescriptionModule } from './modules/prescription/prescription.module';
import { VisitModule } from './modules/visit/visit.module';
import { BedModule } from './modules/bed/bed.module';
import { FhirModule } from './modules/fhir/fhir.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { DiagnosticModule } from './modules/diagnostic/diagnostic.module';
import { AntibiogramModule } from './modules/antibiogram/antibiogram.module';
import { CustodyChainModule } from './modules/custody-chain/custody-chain.module';
import { IvfCycleModule } from './modules/ivf-cycle/ivf-cycle.module';
import { ArtActModule } from './modules/art-act/art-act.module';
import { SpirometryModule } from './modules/spirometry/spirometry.module';
import { AudiometryModule } from './modules/audiometry/audiometry.module';
import { BiRadsModule } from './modules/bi-rads/bi-rads.module';
import { HlaTypingModule } from './modules/hla-typing/hla-typing.module';
import { CryopreservationModule } from './modules/cryopreservation/cryopreservation.module';
import { SedationLogModule } from './modules/sedation-log/sedation-log.module';
import { VideoCaptureModule } from './modules/video-capture/video-capture.module';
import { TumorMarkersModule } from './modules/tumor-markers/tumor-markers.module';
import { GcMsModule } from './modules/gc-ms/gc-ms.module';
import { FraxModule } from './modules/frax/frax.module';
import { WaveformsModule } from './modules/waveforms/waveforms.module';
import { PsgModule } from './modules/psg/psg.module';
import { BeraModule } from './modules/bera/bera.module';
import { SlideScanningModule } from './modules/slide-scanning/slide-scanning.module';
import { IhcModule } from './modules/ihc/ihc.module';
import { FrozenSectionModule } from './modules/frozen-section/frozen-section.module';
import { CpapTitrationModule } from './modules/cpap-titration/cpap-titration.module';
import { CasaModule } from './modules/casa/casa.module';
import { AiScoringModule } from './modules/ai-scoring/ai-scoring.module';
import { FieldAgentsModule } from './modules/field-agents/field-agents.module';
import { RoutePlanningModule } from './modules/route-planning/route-planning.module';
import { DicomViewerModule } from './modules/dicom-viewer/dicom-viewer.module';
import { RadiologistPanelModule } from './modules/radiologist-panel/radiologist-panel.module';
import { ObGrowthScanModule } from './modules/ob-growth-scan/ob-growth-scan.module';

@Module({
  imports: [
    // Global config - loads .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
      limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
    }]),

    // Core
    DatabaseModule,

    // Feature modules
    AuthModule,
    TenantModule,
    PatientModule,
    DoctorModule,
    AppointmentModule,
    BillingModule,
    WhatsappModule,
    NotificationModule,
    CrmModule,
    AutomationModule,
    AnalyticsModule,
    HrmsModule,
    SuperAdminModule,
    PortalModule,
    ControlPlaneModule,
    ChatbotModule,
    SchedulerModule,
    VaultModule,
    LabModule,
    DiagnosticModule,
    PharmacyModule,
    MarketplaceModule,
    SecurityModule,
    ComplianceModule,
    DispatchModule,
    ColdChainModule,
    CultureModule,
    DonorModule,
    CrossmatchModule,
    PrescriptionModule,
    VisitModule,
    BedModule,
    FhirModule,
    SubscriptionModule,
    AntibiogramModule,
    CustodyChainModule,
    IvfCycleModule,
    ArtActModule,
    SpirometryModule,
    AudiometryModule,
    BiRadsModule,
    HlaTypingModule,
    CryopreservationModule,
    SedationLogModule,
    VideoCaptureModule,
    TumorMarkersModule,
    GcMsModule,
    FraxModule,
    WaveformsModule,
    PsgModule,
    BeraModule,
    SlideScanningModule,
    IhcModule,
    FrozenSectionModule,
    CpapTitrationModule,
    CasaModule,
    AiScoringModule,
    FieldAgentsModule,
    RoutePlanningModule,
    DicomViewerModule,
    RadiologistPanelModule,
    ObGrowthScanModule,
  ],
  controllers: [HealthController],
  providers: [StartupService, DbBootstrapService],
})
export class AppModule {}
