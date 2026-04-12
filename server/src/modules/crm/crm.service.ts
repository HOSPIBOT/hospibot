import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}
}
