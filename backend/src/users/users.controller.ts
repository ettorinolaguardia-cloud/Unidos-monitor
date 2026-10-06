import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserSession } from './entities/user-session.entity';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Post('users/login')
  recordLogin(@Body() body: { email: string; name?: string; role?: 'developer' | 'client' }) {
    return this.usersService.recordLogin(body.email, body.name, body.role);
  }

  @Post('users/register')
  registerUser(@Body() body: { email: string; name: string; role?: 'developer' | 'client' }) {
    return this.usersService.registerUser(body);
  }

  @Get('sessions')
  getActiveSessions() {
    return this.usersService.getActiveSessions();
  }

  @Post('sessions')
  registerSession(@Body() sessionDto: Partial<UserSession>) {
    return this.usersService.registerSession(sessionDto);
  }

  @Delete('sessions/:id')
  removeSession(@Param('id') id: string) {
    return this.usersService.removeSession(id);
  }
}
