import { Module } from '@nestjs/common';
import { HrmsController } from './hrms.controller';
import { PrismaService } from '../../database/prisma.service';
import { TierGuard } from '../../common/guards/tier.guard';

@Module({
  controllers: [HrmsController],
  providers: [PrismaService, TierGuard],
})
export class HrmsModule {}
