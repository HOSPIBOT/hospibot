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
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { PortalModule } from './modules/portal/portal.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { VaultModule } from './modules/vault/vault.module';
import { LabModule } from './modules/lab/lab.module';

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
    SuperAdminModule,
    PortalModule,
    ChatbotModule,
    SchedulerModule,
    VaultModule,
    LabModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
