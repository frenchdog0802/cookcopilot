import { Injectable } from '@nestjs/common';
import type { Folder } from '@prisma/client';
import { NotFoundError } from '../common/errors/http-errors';
import { bigintToNumber } from '../common/mappers/user.mapper';
import { nowUnixSeconds } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFolderRequestDto,
  UpdateFolderRequestDto,
  type FolderDto,
} from './dto/folder.dto';

@Injectable()
export class FoldersService {
  static readonly UNCATEGORIZED_NAME = 'Uncategorized';

  private static readonly DEFAULT_FOLDER_NAMES = [
    'Uncategorized',
    'Favorites',
    'Breakfast',
    'Lunch',
    'Dinner',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async listFolders(userId: string): Promise<FolderDto[]> {
    await this.ensureDefaultFolders(userId);
    const folders = await this.prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    return folders.map((folder) => this.toDto(folder));
  }

  async getFolder(userId: string, id: string): Promise<FolderDto> {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId },
    });
    if (!folder) {
      throw new NotFoundError('Folder not found');
    }
    return this.toDto(folder);
  }

  async createFolder(
    userId: string,
    dto: CreateFolderRequestDto,
  ): Promise<FolderDto> {
    const trimmed = dto.name.trim();
    const existing = await this.prisma.folder.findFirst({
      where: {
        userId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    if (existing) {
      return this.toDto(existing);
    }

    const now = BigInt(nowUnixSeconds());
    const folder = await this.prisma.folder.create({
      data: {
        userId,
        name: trimmed,
        color: dto.color ?? null,
        icon: dto.icon ?? 'FolderIcon',
        createdAt: now,
        updatedAt: now,
      },
    });
    return this.toDto(folder);
  }

  async updateFolder(
    userId: string,
    id: string,
    dto: UpdateFolderRequestDto,
  ): Promise<FolderDto> {
    const existing = await this.prisma.folder.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Folder not found');
    }

    const folder = await this.prisma.folder.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        color: dto.color ?? existing.color,
        icon: dto.icon ?? existing.icon,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
    return this.toDto(folder);
  }

  async getOrCreateUncategorized(userId: string): Promise<Folder> {
    return this.findOrCreateByName(userId, FoldersService.UNCATEGORIZED_NAME);
  }

  async findOrCreateByName(userId: string, name: string): Promise<Folder> {
    const trimmed = name.trim();
    const existing = await this.prisma.folder.findFirst({
      where: {
        userId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    if (existing) {
      return existing;
    }

    const now = BigInt(nowUnixSeconds());
    return this.prisma.folder.create({
      data: {
        userId,
        name: trimmed,
        icon: 'FolderIcon',
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async deleteFolder(userId: string, id: string): Promise<{ message: string }> {
    const existing = await this.prisma.folder.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Folder not found');
    }

    await this.prisma.folder.delete({ where: { id } });
    return { message: 'Folder deleted' };
  }

  private async ensureDefaultFolders(userId: string): Promise<void> {
    const now = BigInt(nowUnixSeconds());
    for (const name of FoldersService.DEFAULT_FOLDER_NAMES) {
      const existing = await this.prisma.folder.findFirst({
        where: {
          userId,
          name: { equals: name, mode: 'insensitive' },
        },
      });
      if (!existing) {
        await this.prisma.folder.create({
          data: {
            userId,
            name,
            icon: 'FolderIcon',
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }
  }

  private toDto(folder: Folder): FolderDto {
    return {
      id: folder.id,
      name: folder.name,
      color: folder.color,
      icon: folder.icon,
      created_at: bigintToNumber(folder.createdAt),
      updated_at: bigintToNumber(folder.updatedAt),
    };
  }
}
