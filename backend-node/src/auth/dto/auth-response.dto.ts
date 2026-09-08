import type { User } from '@prisma/client';

export type AuthUserDto = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
};

export function toAuthUserDto(user: User): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    name: user.name,
  };
}

export type SignupResponseData = {
  token: string;
  user: AuthUserDto;
};

export type SigninResponseData = {
  token: string;
  user: AuthUserDto;
};

export type SignoutResponseData = {
  message: string;
};

export type GoogleLoginResponseData = {
  token: string;
  user: AuthUserDto;
};
