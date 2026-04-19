import { Module } from '@nestjs/common';
import { IvfCycleController } from './ivf-cycle.controller';
import { IvfCycleService } from './ivf-cycle.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IvfCycleController],
  providers: [IvfCycleService],
  exports: [IvfCycleService],
})
export class IvfCycleModule {}
