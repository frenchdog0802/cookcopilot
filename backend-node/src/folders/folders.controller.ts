import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ok } from '../common/api-response';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateFolderRequestDto,
  UpdateFolderRequestDto,
} from './dto/folder.dto';
import { FoldersService } from './folders.service';

@Controller('api/folder')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    const folders = await this.foldersService.listFolders(userId);
    return ok({ folders });
  }

  @Get(':id')
  async get(@CurrentUser() userId: string, @Param('id') id: string) {
    const folder = await this.foldersService.getFolder(userId, id);
    return ok({ folder });
  }

  @Post()
  async create(
    @CurrentUser() userId: string,
    @Body() dto: CreateFolderRequestDto,
  ) {
    const folder = await this.foldersService.createFolder(userId, dto);
    return ok({ folder });
  }

  @Put(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFolderRequestDto,
  ) {
    const folder = await this.foldersService.updateFolder(userId, id, dto);
    return ok({ folder });
  }

  @Delete(':id')
  async remove(@CurrentUser() userId: string, @Param('id') id: string) {
    const result = await this.foldersService.deleteFolder(userId, id);
    return ok(result);
  }
}
