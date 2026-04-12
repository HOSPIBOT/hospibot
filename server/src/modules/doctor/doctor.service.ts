import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}
}
