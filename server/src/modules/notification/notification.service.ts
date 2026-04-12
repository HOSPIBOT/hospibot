import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}
}
