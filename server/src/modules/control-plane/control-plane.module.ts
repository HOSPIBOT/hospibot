import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ControlPlaneService } from './control-plane.service';
import {
  ControlPlanePublicController,
  ControlPlaneAdminController,
} from './control-plane.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ControlPlanePublicController, ControlPlaneAdminController],
  providers: [ControlPlaneService],
  exports: [ControlPlaneService],
})
export class ControlPlaneModule {}
