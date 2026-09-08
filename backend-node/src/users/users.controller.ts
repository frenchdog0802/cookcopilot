import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ok } from '../common/api-response';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserRequestDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Returns only the authenticated user (no directory listing). */
  @Get()
  async list(@CurrentUser() userId: string) {
    const users = await this.usersService.listSelf(userId);
    return ok({ users });
  }

  @Get(':id')
  async get(@CurrentUser() userId: string, @Param('id') id: string) {
    const user = await this.usersService.getUser(userId, id);
    return ok({ user });
  }

  @Put(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ) {
    const user = await this.usersService.updateUser(userId, id, dto);
    return ok({ user });
  }

  @Delete(':id')
  async remove(@CurrentUser() userId: string, @Param('id') id: string) {
    const result = await this.usersService.deleteUser(userId, id);
    return ok(result);
  }
}
