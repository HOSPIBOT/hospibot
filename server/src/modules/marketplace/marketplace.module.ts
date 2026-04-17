import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { DatabaseModule } from '../../database/database.module';
import { TierGuard } from '../../common/guards/tier.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, TierGuard],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
