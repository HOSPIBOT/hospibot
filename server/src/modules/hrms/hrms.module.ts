import { Module } from '@nestjs/common';
import { HrmsController } from './hrms.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [HrmsController],
  providers: [PrismaService],
})
export class HrmsModule {}
