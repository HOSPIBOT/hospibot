import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}
}
