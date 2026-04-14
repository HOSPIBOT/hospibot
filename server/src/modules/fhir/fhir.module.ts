import { Module } from '@nestjs/common';
import { FhirController } from './fhir.controller';
import { FhirService } from './fhir.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FhirController],
  providers: [FhirService],
  exports: [FhirService],
})
export class FhirModule {}
