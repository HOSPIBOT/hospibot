import { Module } from '@nestjs/common';
import { FrozenSectionController } from './frozen-section.controller';
import { FrozenSectionService } from './frozen-section.service';

@Module({
  controllers: [FrozenSectionController],
  providers: [FrozenSectionService],
  exports: [FrozenSectionService],
})
export class FrozenSectionModule {}
