import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}
}
