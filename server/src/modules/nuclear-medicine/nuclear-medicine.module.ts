import { Module } from '@nestjs/common';
import { NuclearMedicineController } from './nuclear-medicine.controller';
import { NuclearMedicineService } from './nuclear-medicine.service';
@Module({ controllers: [NuclearMedicineController], providers: [NuclearMedicineService], exports: [NuclearMedicineService] })
export class NuclearMedicineModule {}
