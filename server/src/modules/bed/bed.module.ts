import { Module } from '@nestjs/common';
import { BedController } from './bed.controller';
import { BedService } from './bed.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BedController],
  providers: [BedService],
  exports: [BedService],
})
export class BedModule {}
