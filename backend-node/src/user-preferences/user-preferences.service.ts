import { Injectable } from '@nestjs/common';
import type { UserPreference } from '@prisma/client';
import { nowUnixSeconds } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateUserPreferenceRequestDto,
  type UserPreferenceDto,
} from './dto/user-preference.dto';

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string): Promise<UserPreferenceDto> {
    const preference = await this.ensurePreference(userId);
    return this.toDto(preference.id);
  }

  async updatePreferences(
    userId: string,
    dto: UpdateUserPreferenceRequestDto,
  ): Promise<UserPreferenceDto> {
    const preference = await this.ensurePreference(userId);
    const now = BigInt(nowUnixSeconds());

    await this.prisma.userPreference.update({
      where: { id: preference.id },
      data: {
        householdNotes: dto.householdNotes ?? preference.householdNotes,
        measurementUnit: dto.measurementUnit ?? preference.measurementUnit,
        notes: dto.notes ?? preference.notes,
        updatedAt: now,
      },
    });

    if (dto.allergies !== undefined) {
      await this.prisma.userPreferenceAllergy.deleteMany({
        where: { preferenceId: preference.id },
      });
      if (dto.allergies.length > 0) {
        await this.prisma.userPreferenceAllergy.createMany({
          data: dto.allergies.map((item) => ({
            preferenceId: preference.id,
            item,
          })),
        });
      }
    }

    if (dto.dislikes !== undefined) {
      await this.prisma.userPreferenceDislike.deleteMany({
        where: { preferenceId: preference.id },
      });
      if (dto.dislikes.length > 0) {
        await this.prisma.userPreferenceDislike.createMany({
          data: dto.dislikes.map((item) => ({
            preferenceId: preference.id,
            item,
          })),
        });
      }
    }

    if (dto.likes !== undefined) {
      await this.prisma.userPreferenceLike.deleteMany({
        where: { preferenceId: preference.id },
      });
      if (dto.likes.length > 0) {
        await this.prisma.userPreferenceLike.createMany({
          data: dto.likes.map((item) => ({
            preferenceId: preference.id,
            item,
          })),
        });
      }
    }

    if (dto.dietaryRestrictions !== undefined) {
      await this.prisma.userPreferenceDietaryRestriction.deleteMany({
        where: { preferenceId: preference.id },
      });
      if (dto.dietaryRestrictions.length > 0) {
        await this.prisma.userPreferenceDietaryRestriction.createMany({
          data: dto.dietaryRestrictions.map((item) => ({
            preferenceId: preference.id,
            item,
          })),
        });
      }
    }

    return this.toDto(preference.id);
  }

  private async ensurePreference(userId: string): Promise<UserPreference> {
    const existing = await this.prisma.userPreference.findUnique({
      where: { userId },
    });
    if (existing) {
      return existing;
    }

    const now = BigInt(nowUnixSeconds());
    return this.prisma.userPreference.create({
      data: {
        userId,
        measurementUnit: 'metric',
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  private async toDto(preferenceId: string): Promise<UserPreferenceDto> {
    const preference = await this.prisma.userPreference.findUniqueOrThrow({
      where: { id: preferenceId },
      include: {
        allergies: true,
        dislikes: true,
        likes: true,
        dietaryRestrictions: true,
      },
    });

    return {
      id: preference.id,
      householdNotes: preference.householdNotes,
      measurementUnit: preference.measurementUnit,
      notes: preference.notes,
      allergies: preference.allergies.map((row) => row.item),
      dislikes: preference.dislikes.map((row) => row.item),
      likes: preference.likes.map((row) => row.item),
      dietaryRestrictions: preference.dietaryRestrictions.map(
        (row) => row.item,
      ),
    };
  }
}
