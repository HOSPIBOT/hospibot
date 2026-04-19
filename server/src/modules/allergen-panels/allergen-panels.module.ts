import { Module } from '@nestjs/common';
import { AllergenPanelsController } from './allergen-panels.controller';
import { AllergenPanelsService } from './allergen-panels.service';

@Module({
  controllers: [AllergenPanelsController],
  providers: [AllergenPanelsService],
  exports: [AllergenPanelsService],
})
export class AllergenPanelsModule {}
