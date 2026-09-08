import { Module } from '@nestjs/common';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { UsageQuotaModule } from '../usage-quota/usage-quota.module';
import { StripeSubscriptionService } from './stripe-subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [UsageQuotaModule, EntitlementModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, StripeSubscriptionService],
  exports: [SubscriptionService, StripeSubscriptionService],
})
export class SubscriptionModule {}
