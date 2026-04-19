import { Module } from '@nestjs/common';
import { HolterAllocationController } from './holter-allocation.controller';
import { HolterAllocationService } from './holter-allocation.service';

@Module({
  controllers: [HolterAllocationController],
  providers: [HolterAllocationService],
  exports: [HolterAllocationService],
})
export class HolterAllocationModule {}
