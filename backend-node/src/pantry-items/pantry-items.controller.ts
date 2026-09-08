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
  BulkPantryItemsRequestDto,
  CreatePantryItemRequestDto,
  UpdatePantryItemRequestDto,
} from './dto/pantry-item.dto';
import { PantryItemsService } from './pantry-items.service';

@Controller('api/pantry-item')
export class PantryItemsController {
  constructor(private readonly pantryItemsService: PantryItemsService) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    const items = await this.pantryItemsService.listItems(userId);
    return ok({ items });
  }

  @Get(':id')
  async get(@CurrentUser() userId: string, @Param('id') id: string) {
    const item = await this.pantryItemsService.getItem(userId, id);
    return ok({ item });
  }

  @Post('bulk')
  async bulkCreate(
    @CurrentUser() userId: string,
    @Body() dto: BulkPantryItemsRequestDto,
  ) {
    const items = await this.pantryItemsService.bulkCreateItems(userId, dto);
    return ok({ items });
  }

  @Put('bulk')
  async bulkUpdate(
    @CurrentUser() userId: string,
    @Body() dto: BulkPantryItemsRequestDto,
  ) {
    const items = await this.pantryItemsService.bulkUpdateItems(userId, dto);
    return ok({ items });
  }

  @Post()
  async create(
    @CurrentUser() userId: string,
    @Body() dto: CreatePantryItemRequestDto,
  ) {
    const item = await this.pantryItemsService.createItem(userId, dto);
    return ok({ item });
  }

  @Put(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePantryItemRequestDto,
  ) {
    const item = await this.pantryItemsService.updateItem(userId, id, dto);
    return ok({ item });
  }

  @Delete(':id')
  async remove(@CurrentUser() userId: string, @Param('id') id: string) {
    const result = await this.pantryItemsService.deleteItem(userId, id);
    return ok(result);
  }
}
