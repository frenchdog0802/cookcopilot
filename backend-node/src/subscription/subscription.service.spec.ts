import { ConfigService } from '@nestjs/config';
import { BadRequestError } from '../common/errors/http-errors';
import { SUBSCRIPTION_DEFAULTS } from '../config/env.constants';
import { EntitlementService } from '../entitlement/entitlement.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsageQuotaService } from '../usage-quota/usage-quota.service';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService IAP hardening', () => {
  function createService(): SubscriptionService {
    const configService = {
      get: () => ({
        subscription: {
          ...SUBSCRIPTION_DEFAULTS,
          plans: SUBSCRIPTION_DEFAULTS.plans.map((plan) => ({ ...plan })),
        },
        optional: {},
      }),
    } as unknown as ConfigService;

    return new SubscriptionService(
      {} as PrismaService,
      {} as UsageQuotaService,
      {} as EntitlementService,
      configService,
    );
  }

  it('rejects syncPurchase instead of granting Pro from client claims', async () => {
    const service = createService();
    await expect(
      service.syncPurchase('user-1', {
        productId: 'com.lardermind.pro.monthly',
        transactionId: 'fake-tx',
        platform: 'ios',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects validateReceipt instead of always returning valid:true', async () => {
    const service = createService();
    await expect(
      service.validateReceipt('user-1', {
        productId: 'com.lardermind.pro.monthly',
        receipt: 'fake-receipt',
        platform: 'ios',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects unknown productId early', async () => {
    const service = createService();
    await expect(
      service.syncPurchase('user-1', {
        productId: 'not-a-real-product',
      }),
    ).rejects.toThrow(/Unknown productId/);
  });
});
