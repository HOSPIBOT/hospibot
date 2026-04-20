import { Module } from '@nestjs/common';
import { EndoscopyCenterController } from './endoscopy-center.controller';
import { EndoscopyCenterService } from './endoscopy-center.service';
@Module({ controllers: [EndoscopyCenterController], providers: [EndoscopyCenterService], exports: [EndoscopyCenterService] })
export class EndoscopyCenterModule {}
