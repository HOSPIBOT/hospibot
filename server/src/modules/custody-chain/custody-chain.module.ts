import { Module } from '@nestjs/common';
import { CustodyChainController } from './custody-chain.controller';
import { CustodyChainService } from './custody-chain.service';

@Module({
  controllers: [CustodyChainController],
  providers: [CustodyChainService],
  exports: [CustodyChainService],
})
export class CustodyChainModule {}
