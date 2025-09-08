import { BadRequestException, Injectable, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/enum/user.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomBytes, randomInt } from 'crypto';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
    private readonly configService: ConfigService,
  ) {}

  // Access config values through getters
  private get ACCESS_EXPIRES_IN(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '1h');
  }

  private get REFRESH_EXPIRES_SECONDS(): number {
    return this.configService.get<number>('REFRESH_EXPIRES_SECONDS', 604800); // 7 days
  }

  private get BCRYPT_SALT_ROUNDS(): number {
    return this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
  }

  private get OTP_HASH_SALT_ROUNDS(): number {
    return this.configService.get<number>('OTP_HASH_SALT_ROUNDS', 10);
  }

  private get OTP_TTL_SECONDS(): number {
    return this.configService.get<number>('OTP_TTL_SECONDS', 900); // 15 minutes
  }

  async register(dto: RegisterDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // 2. Validate password length
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);

    // 4. Generate OTP
    const otp = String(randomInt(100000, 1000000));
    const hashedOtp = await bcrypt.hash(otp, this.OTP_HASH_SALT_ROUNDS);
    const verificationExpiry = new Date(Date.now() + this.OTP_TTL_SECONDS * 1000);

    const user = await this.userService.create(dto.email, hashedPassword, UserRole.USER, {
      verificationToken: hashedOtp,
      verificationTokenExpiry: verificationExpiry,
      isVerified: false,
    });

    try {
      const payload = {
        to: dto.email,
        type: 'verification_otp',
        data: {
          otp,
          expiresIn: this.OTP_TTL_SECONDS,
        },
      };
      await this.redisClient.publish?.('mail:send', JSON.stringify(payload));
    } catch (e) {
      this.logger.warn('Failed to enqueue verification email', e as any);
    }
    return {
      id: (user as any).id,
      email: (user as any).email,
      message: 'Registered — check your email for the verification code',
    };
  }

  	async login(dto: LoginDto) {
		const user = await this.userService.findByEmail(dto.email);
		if (!user) throw new UnauthorizedException('Invalid credentials');

		const valid = await bcrypt.compare(dto.password, user.password);
		if (!valid) throw new UnauthorizedException('Invalid credentials');

		const accessToken = this.jwtService.sign(
			{ sub: (user as any).id, email: (user as any).email, role: (user as any).role },
			{ expiresIn: this.ACCESS_EXPIRES_IN },
		);

		// create a refresh token and store hashed in Redis
		const refreshToken = randomBytes(64).toString('hex');
		const refreshId = randomBytes(16).toString('hex');
		const refreshHash = await bcrypt.hash(refreshToken, 10);
		const redisKey = `refresh:${refreshId}`;
		await this.redisClient.set(redisKey, JSON.stringify({ userId: (user as any).id, hash: refreshHash }), 'EX', this.REFRESH_EXPIRES_SECONDS);

		const clientRefreshToken = `${refreshId}.${refreshToken}`;
		return { accessToken, refreshToken: clientRefreshToken, expiresIn: this.ACCESS_EXPIRES_IN };
	}

	async refresh(clientToken: string) {
		const parts = clientToken.split('.');
		if (parts.length !== 2) throw new BadRequestException('Invalid refresh token');
		const [refreshId, token] = parts;
		const redisKey = `refresh:${refreshId}`;
		const data = await this.redisClient.get(redisKey);
		if (!data) throw new UnauthorizedException('Refresh token not found or expired');

		let parsed: { userId: string; hash: string };
		try {
			parsed = JSON.parse(data);
		} catch (e) {
			throw new UnauthorizedException('Invalid refresh token data');
		}

		const valid = await bcrypt.compare(token, parsed.hash);
		if (!valid) throw new UnauthorizedException('Invalid refresh token');

		const user = await this.userService.findById(parsed.userId);
		if (!user) throw new UnauthorizedException('User not found');

		// rotate: delete old and issue new
		await this.redisClient.del(redisKey);
		const newRefreshToken = randomBytes(64).toString('hex');
		const newRefreshId = randomBytes(16).toString('hex');
		const newHash = await bcrypt.hash(newRefreshToken, 10);
		const newKey = `refresh:${newRefreshId}`;
		await this.redisClient.set(newKey, JSON.stringify({ userId: (user as any).id, hash: newHash }), 'EX', this.REFRESH_EXPIRES_SECONDS);

		const accessToken = this.jwtService.sign(
			{ sub: (user as any).id, email: (user as any).email, role: (user as any).role },
			{ expiresIn: this.ACCESS_EXPIRES_IN },
		);
		const clientNewRefresh = `${newRefreshId}.${newRefreshToken}`;
		return { accessToken, refreshToken: clientNewRefresh, expiresIn: this.ACCESS_EXPIRES_IN };
	}

	async logout(clientToken: string) {
		const parts = clientToken.split('.');
		if (parts.length !== 2) throw new BadRequestException('Invalid refresh token');
		const [refreshId] = parts;
		const redisKey = `refresh:${refreshId}`;
		await this.redisClient.del(redisKey);
		return { success: true };
	}
}



