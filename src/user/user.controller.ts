import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('user')
export class UserController {
	@Get('admin')
	@UseGuards(RolesGuard)
	@Roles('admin')
	getAdminData() {
		return { message: 'Only admins can access this route.' };
	}
}
