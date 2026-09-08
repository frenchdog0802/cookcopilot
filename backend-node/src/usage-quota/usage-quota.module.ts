import { Module } from '@nestjs/common';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { UsageQuotaService } from './usage-quota.service';

@Module({
  imports: [EntitlementModule],
  providers: [UsageQuotaService],
  exports: [UsageQuotaService],
})
export class UsageQuotaModule {}
