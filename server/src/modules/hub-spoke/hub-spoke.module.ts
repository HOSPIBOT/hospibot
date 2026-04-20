import { Module } from '@nestjs/common';
import { HubSpokeController } from './hub-spoke.controller';
import { HubSpokeService } from './hub-spoke.service';
@Module({ controllers: [HubSpokeController], providers: [HubSpokeService], exports: [HubSpokeService] })
export class HubSpokeModule {}
