import { Module } from '@nestjs/common';
import { NgsWorkflowController } from './ngs-workflow.controller';
import { NgsWorkflowService } from './ngs-workflow.service';
@Module({ controllers: [NgsWorkflowController], providers: [NgsWorkflowService], exports: [NgsWorkflowService] })
export class NgsWorkflowModule {}
