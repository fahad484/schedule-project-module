import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/authenticated-user';
import type { AuthenticatedUser } from '../common/authenticated-user';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AppointmentsService } from './appointments.service';
import { createAppointmentSchema } from './appointments.schemas';
import type { CreateAppointmentDto } from './appointments.schemas';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  book(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createAppointmentSchema)) body: CreateAppointmentDto,
  ) {
    return this.appointmentsService.book(user, body);
  }

  @Get('me')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findMine(user);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointmentsService.cancel(user, id);
  }

  @Patch(':id/complete')
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointmentsService.complete(user, id);
  }
}
