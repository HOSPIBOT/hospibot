import { Module } from '@nestjs/common';
import { SonologistPanelController } from './sonologist-panel.controller';
import { SonologistPanelService } from './sonologist-panel.service';

@Module({
  controllers: [SonologistPanelController],
  providers: [SonologistPanelService],
  exports: [SonologistPanelService],
})
export class SonologistPanelModule {}
