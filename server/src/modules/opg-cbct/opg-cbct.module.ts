import { Module } from '@nestjs/common';
import { OpgCbctController } from './opg-cbct.controller';
import { OpgCbctService } from './opg-cbct.service';
@Module({ controllers: [OpgCbctController], providers: [OpgCbctService], exports: [OpgCbctService] })
export class OpgCbctModule {}
