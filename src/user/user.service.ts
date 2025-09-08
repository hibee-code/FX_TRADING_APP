import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './enum/user.enum';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
	) {}

		async create(
		email: string,
		password: string,
		role: UserRole = UserRole.USER,
		extras?: Partial<User>,
	) {
		const user = this.usersRepository.create({
			email,
			password,
			role,
			isVerified: extras?.isVerified ?? false,
			verificationToken: extras?.verificationToken,
			verificationTokenExpiry: extras?.verificationTokenExpiry,
		} as Partial<User>);
		return this.usersRepository.save(user);
	}

	async findByEmail(email: string) {
		return this.usersRepository.findOne({ where: { email } });
	}

	async findById(id: string) {
		return this.usersRepository.findOne({ where: { id } });
	}
}
