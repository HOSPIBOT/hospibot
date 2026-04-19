import { Module } from '@nestjs/common';
import { ColdChainController } from './cold-chain.controller';
import { ColdChainService } from './cold-chain.service';

@Module({
  controllers: [ColdChainController],
  providers: [ColdChainService],
  exports: [ColdChainService],
})
export class ColdChainModule {}
