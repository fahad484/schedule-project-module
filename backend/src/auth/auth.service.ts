import {
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { DataSource, QueryFailedError } from 'typeorm';
import { Doctor, Patient, User, UserRole } from '../database/entities';
import { LoginDto, RegisterDto } from './auth.schemas';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  specialty?: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResult> {
    if (input.role === 'DOCTOR') {
      const signupCode = process.env.DOCTOR_SIGNUP_CODE;
      if (!signupCode || input.doctorSignupCode !== signupCode) {
        throw new ForbiddenException('A valid doctor invitation code is required to create a doctor account.');
      }
    }
    try {
      const user = await this.dataSource.transaction(async (manager) => {
        const account = manager.create(User, {
          email: input.email.toLowerCase(),
          passwordHash: await bcrypt.hash(input.password, 12),
          role: input.role as UserRole,
        });
        await manager.save(account);

        if (input.role === 'PATIENT') {
          await manager.save(manager.create(Patient, {
            userId: account.id,
            fullName: input.fullName,
            phone: input.phone ?? null,
          }));
        } else {
          await manager.save(manager.create(Doctor, {
            userId: account.id,
            fullName: input.fullName,
            specialty: input.specialty,
            bio: input.bio ?? null,
            licenseNumber: input.licenseNumber ?? null,
            consultationFeeCents: input.consultationFeeCents ?? 0,
            timeZone: input.timeZone ?? 'UTC',
          }));
        }
        return account;
      });
      return this.issueResult(user);
    } catch (error) {
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
        throw new ConflictException('An account with this email or license number already exists.');
      }
      throw error;
    }
  }

  async login(input: LoginDto): Promise<AuthResult> {
    const user = await this.dataSource.getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email: input.email })
      .getOne();

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }
    return this.issueResult(user);
  }

  async currentUser(userId: string): Promise<PublicUser> {
    const user = await this.dataSource.getRepository(User).findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('This account is no longer available.');
    return this.toPublicUser(user);
  }

  private async issueResult(user: User): Promise<AuthResult> {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException('Authentication is not configured. Set a JWT_SECRET of at least 32 characters.');
    }
    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret, expiresIn: '7d' },
    );
    return { token, user: await this.toPublicUser(user) };
  }

  private async toPublicUser(user: User): Promise<PublicUser> {
    if (user.role === UserRole.DOCTOR) {
      const doctor = await this.dataSource.getRepository(Doctor).findOneBy({ userId: user.id });
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: doctor?.fullName ?? user.email,
        specialty: doctor?.specialty,
      };
    }
    if (user.role === UserRole.PATIENT) {
      const patient = await this.dataSource.getRepository(Patient).findOneBy({ userId: user.id });
      return { id: user.id, email: user.email, role: user.role, fullName: patient?.fullName ?? user.email };
    }
    return { id: user.id, email: user.email, role: user.role, fullName: user.email };
  }
}
