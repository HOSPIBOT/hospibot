import { Module } from '@nestjs/common';
import { VariantDatabaseController } from './variant-database.controller';
import { VariantDatabaseService } from './variant-database.service';

@Module({
  controllers: [VariantDatabaseController],
  providers: [VariantDatabaseService],
  exports: [VariantDatabaseService],
})
export class VariantDatabaseModule {}
