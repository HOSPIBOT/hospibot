import { Module } from '@nestjs/common';
import { FranchiseLabsController } from './franchise-labs.controller';
import { FranchiseLabsService } from './franchise-labs.service';
@Module({ controllers: [FranchiseLabsController], providers: [FranchiseLabsService], exports: [FranchiseLabsService] })
export class FranchiseLabsModule {}
