import { Module } from '@nestjs/common';
import { CustodyChainController } from './custody-chain.controller';
import { CustodyChainService } from './custody-chain.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustodyChainController],
  providers: [CustodyChainService],
  exports: [CustodyChainService],
})
export class CustodyChainModule {}
