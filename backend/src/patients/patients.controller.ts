import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/authenticated-user';
import type { AuthenticatedUser } from '../common/authenticated-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientsService } from './patients.service';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.patientsService.findMine(user.sub, user.role);
  }
}
