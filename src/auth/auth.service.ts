import { BadRequestException, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
		@Inject('REDIS_CLIENT') private readonly redisClient: any,
	) {}

	private ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
	private REFRESH_EXPIRES_SECONDS = parseInt(process.env.REFRESH_EXPIRES_SECONDS || '604800', 10); // 7 days

	async register(dto: RegisterDto) {
		const existing = await this.userService.findByEmail(dto.email);
		if (existing) throw new BadRequestException('Email already registered');

		const hashed = await bcrypt.hash(dto.password, 10);
		const user = await this.userService.create(dto.email, hashed);
		return { id: (user as any).id, email: (user as any).email };
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
