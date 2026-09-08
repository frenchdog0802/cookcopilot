import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ok } from '../common/api-response';
import {
  BulkCreateIngredientsRequestDto,
  CreateIngredientRequestDto,
  UpdateIngredientRequestDto,
} from './dto/ingredient.dto';
import { IngredientsService } from './ingredients.service';

@Controller('api/ingredient')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  async list(@Query('query') query?: string) {
    const ingredients = await this.ingredientsService.listIngredients(query);
    return ok({ ingredients });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const ingredient = await this.ingredientsService.getIngredient(id);
    return ok({ ingredient });
  }

  @Post('bulk')
  async bulkCreate(@Body() dto: BulkCreateIngredientsRequestDto) {
    const ingredients = await this.ingredientsService.bulkCreateIngredients(
      dto.ingredients,
    );
    return ok({ ingredients });
  }

  @Post()
  async create(@Body() dto: CreateIngredientRequestDto) {
    const ingredient = await this.ingredientsService.createIngredient(dto);
    return ok({ ingredient });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIngredientRequestDto,
  ) {
    const ingredient = await this.ingredientsService.updateIngredient(id, dto);
    return ok({ ingredient });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.ingredientsService.deleteIngredient(id);
    return ok(result);
  }
}
