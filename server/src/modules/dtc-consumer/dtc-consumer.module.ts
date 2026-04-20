import { Module } from '@nestjs/common';
import { DtcConsumerController } from './dtc-consumer.controller';
import { DtcConsumerService } from './dtc-consumer.service';
@Module({ controllers: [DtcConsumerController], providers: [DtcConsumerService], exports: [DtcConsumerService] })
export class DtcConsumerModule {}
