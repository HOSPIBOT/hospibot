import { Module } from '@nestjs/common';
import { RadiologistPanelController } from './radiologist-panel.controller';
import { RadiologistPanelService } from './radiologist-panel.service';

@Module({
  controllers: [RadiologistPanelController],
  providers: [RadiologistPanelService],
  exports: [RadiologistPanelService],
})
export class RadiologistPanelModule {}
