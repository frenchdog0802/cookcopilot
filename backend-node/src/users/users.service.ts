import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../common/errors/http-errors';
import { nowUnixSeconds } from '../common/time';
import {
  toUserDetailDto,
  toUserListItemDto,
  type UserDetailDto,
  type UserListItemDto,
} from '../common/mappers/user.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserRequestDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listSelf(actorUserId: string): Promise<UserListItemDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: actorUserId },
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return [toUserListItemDto(user)];
  }

  async getUser(actorUserId: string, id: string): Promise<UserDetailDto> {
    this.assertSelf(actorUserId, id);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toUserDetailDto(user);
  }

  async updateUser(
    actorUserId: string,
    id: string,
    dto: UpdateUserRequestDto,
  ): Promise<UserDetailDto> {
    this.assertSelf(actorUserId, id);
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const firstName = dto.first_name ?? existing.firstName;
    const lastName = dto.last_name ?? existing.lastName;
    const name = `${firstName} ${lastName}`.trim();

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        name,
        email: dto.email ?? existing.email,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });

    return toUserDetailDto(user);
  }

  async deleteUser(
    actorUserId: string,
    id: string,
  ): Promise<{ message: string }> {
    this.assertSelf(actorUserId, id);
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }

  private assertSelf(actorUserId: string, targetId: string): void {
    if (actorUserId !== targetId) {
      // Do not leak whether another user id exists.
      throw new NotFoundError('User not found');
    }
  }
}
