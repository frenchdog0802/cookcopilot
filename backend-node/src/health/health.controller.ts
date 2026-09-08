import { Controller, Get } from '@nestjs/common';
import { nowUnixSeconds } from '../common/time';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/health')
@Public()
export class HealthController {
  @Get()
  getHealth(): { status: string; timestamp: number } {
    return {
      status: 'UP',
      timestamp: nowUnixSeconds(),
    };
  }
}
