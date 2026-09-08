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
  BulkShoppingListItemsRequestDto,
  CreateShoppingListItemRequestDto,
  UpdateShoppingListItemRequestDto,
} from './dto/shopping-list.dto';
import { ShoppingListService } from './shopping-list.service';

@Controller('api/shopping-list')
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    const items = await this.shoppingListService.listItems(userId);
    return ok({ items });
  }

  @Get(':id')
  async get(@CurrentUser() userId: string, @Param('id') id: string) {
    const item = await this.shoppingListService.getItem(userId, id);
    return ok({ item });
  }

  @Post('bulk')
  async bulkCreate(
    @CurrentUser() userId: string,
    @Body() dto: BulkShoppingListItemsRequestDto,
  ) {
    const items = await this.shoppingListService.bulkCreateItems(userId, dto);
    return ok({ items });
  }

  @Post()
  async create(
    @CurrentUser() userId: string,
    @Body() dto: CreateShoppingListItemRequestDto,
  ) {
    const item = await this.shoppingListService.createItem(userId, dto);
    return ok({ item });
  }

  @Put(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShoppingListItemRequestDto,
  ) {
    const item = await this.shoppingListService.updateItem(userId, id, dto);
    return ok({ item });
  }

  @Delete(':id')
  async remove(@CurrentUser() userId: string, @Param('id') id: string) {
    const result = await this.shoppingListService.deleteItem(userId, id);
    return ok(result);
  }
}
