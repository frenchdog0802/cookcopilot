import type { User } from '@prisma/client';

export type UserListItemDto = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type UserDetailDto = UserListItemDto;

export function toUserListItemDto(user: User): UserListItemDto {
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
  };
}

export function toUserDetailDto(user: User): UserDetailDto {
  return toUserListItemDto(user);
}

export function bigintToNumber(
  value: bigint | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
}
