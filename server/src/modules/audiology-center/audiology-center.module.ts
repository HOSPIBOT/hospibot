import { Module } from '@nestjs/common';
import { AudiologyCenterController } from './audiology-center.controller';
import { AudiologyCenterService } from './audiology-center.service';
@Module({ controllers: [AudiologyCenterController], providers: [AudiologyCenterService], exports: [AudiologyCenterService] })
export class AudiologyCenterModule {}
