import { Module } from '@nestjs/common';
import { IvfEmbryologyLabController } from './ivf-embryology-lab.controller';
import { IvfEmbryologyLabService } from './ivf-embryology-lab.service';
@Module({ controllers: [IvfEmbryologyLabController], providers: [IvfEmbryologyLabService], exports: [IvfEmbryologyLabService] })
export class IvfEmbryologyLabModule {}
