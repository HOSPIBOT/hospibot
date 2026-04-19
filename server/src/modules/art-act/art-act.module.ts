import { Module } from '@nestjs/common';
import { ArtActController } from './art-act.controller';
import { ArtActService } from './art-act.service';

@Module({
  controllers: [ArtActController],
  providers: [ArtActService],
  exports: [ArtActService],
})
export class ArtActModule {}
