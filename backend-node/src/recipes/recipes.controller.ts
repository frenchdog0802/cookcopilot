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
  CreateRecipeRequestDto,
  UpdateRecipeRequestDto,
} from './dto/recipe.dto';
import { RecipesService } from './recipes.service';

@Controller('api/recipe')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    const recipes = await this.recipesService.listRecipes(userId);
    return ok({ recipes });
  }

  @Get(':id')
  async get(@CurrentUser() userId: string, @Param('id') id: string) {
    const recipe = await this.recipesService.getRecipe(userId, id);
    return ok({ recipe });
  }

  @Post()
  async create(
    @CurrentUser() userId: string,
    @Body() dto: CreateRecipeRequestDto,
  ) {
    const recipe = await this.recipesService.createRecipe(userId, dto);
    return ok({ recipe });
  }

  @Put(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecipeRequestDto,
  ) {
    const recipe = await this.recipesService.updateRecipe(userId, id, dto);
    return ok({ recipe });
  }

  @Delete(':id')
  async remove(@CurrentUser() userId: string, @Param('id') id: string) {
    const result = await this.recipesService.deleteRecipe(userId, id);
    return ok(result);
  }
}
