import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/authenticated-user';
import type { AuthenticatedUser } from '../common/authenticated-user';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { availabilityInputSchema, appointmentDateSchema } from './availability.schemas';
import type { AvailabilityInput } from './availability.schemas';
import { AvailabilityService } from './availability.service';

@Controller()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('doctors/:doctorId/slots')
  availableSlots(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date', new ZodValidationPipe(appointmentDateSchema)) date: string,
  ) {
    return this.availabilityService.listForDoctor(doctorId, date);
  }

  @UseGuards(JwtAuthGuard)
  @Post('availability/me')
  addAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(availabilityInputSchema)) body: AvailabilityInput,
  ) {
    return this.availabilityService.addForDoctor(user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('availability/me')
  myAvailability(@CurrentUser() user: AuthenticatedUser) {
    return this.availabilityService.listMine(user.sub);
  }
}
