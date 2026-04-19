import { Module } from '@nestjs/common';
import { AntibiogramController } from './antibiogram.controller';
import { AntibiogramService } from './antibiogram.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AntibiogramController],
  providers: [AntibiogramService],
  exports: [AntibiogramService],
})
export class AntibiogramModule {}
