import { Body, Controller, Get, Put } from '@nestjs/common';
import { ok } from '../common/api-response';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserPreferenceRequestDto } from './dto/user-preference.dto';
import { UserPreferencesService } from './user-preferences.service';

@Controller('api/user-preferences')
export class UserPreferencesController {
  constructor(
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  @Get()
  async get(@CurrentUser() userId: string) {
    const preferences =
      await this.userPreferencesService.getPreferences(userId);
    return ok({ preferences });
  }

  @Put()
  async update(
    @CurrentUser() userId: string,
    @Body() dto: UpdateUserPreferenceRequestDto,
  ) {
    const preferences = await this.userPreferencesService.updatePreferences(
      userId,
      dto,
    );
    return ok({ preferences });
  }
}
