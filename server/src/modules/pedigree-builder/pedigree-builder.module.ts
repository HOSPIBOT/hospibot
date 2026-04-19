import { Module } from '@nestjs/common';
import { PedigreeBuilderController } from './pedigree-builder.controller';
import { PedigreeBuilderService } from './pedigree-builder.service';

@Module({
  controllers: [PedigreeBuilderController],
  providers: [PedigreeBuilderService],
  exports: [PedigreeBuilderService],
})
export class PedigreeBuilderModule {}
