import { Module } from '@nestjs/common';
import { EmployerPortalController } from './employer-portal.controller';
import { EmployerPortalService } from './employer-portal.service';

@Module({
  controllers: [EmployerPortalController],
  providers: [EmployerPortalService],
  exports: [EmployerPortalService],
})
export class EmployerPortalModule {}
