import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  async createUser(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('role') role: UserRole | string,
  ) {
    // Gelen string'i UserRole tipine çeviriyoruz
    const finalRole = role as UserRole;

    return this.usersService.create(username, password, finalRole);
  }

  @Get()
  async list() {
    return this.usersService.findAll();
  }
}
