import { Module } from '@nestjs/common';
import { HraController } from './hra.controller';
import { HraService } from './hra.service';
@Module({ controllers: [HraController], providers: [HraService], exports: [HraService] })
export class HraModule {}
