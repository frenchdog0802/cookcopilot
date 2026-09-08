import { ConfigService } from '@nestjs/config';
import { SUBSCRIPTION_DEFAULTS } from '../config/env.constants';
import { nowUnixSeconds } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementService } from './entitlement.service';

describe('EntitlementService', () => {
  const userId = 'user-1';

  function createService(prisma: Partial<PrismaService>): EntitlementService {
    const configService = {
      get: () => ({ subscription: { ...SUBSCRIPTION_DEFAULTS } }),
    } as unknown as ConfigService;
    return new EntitlementService(prisma as PrismaService, configService);
  }

  it('findActiveSubscription ignores expired period end', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const service = createService({
      subscription: { findFirst } as never,
    });

    await service.findActiveSubscription(userId);

    const arg = findFirst.mock.calls[0][0] as {
      where: {
        userId: string;
        status: { in: string[] };
        OR: unknown[];
      };
    };
    expect(arg.where.userId).toBe(userId);
    expect(arg.where.status).toEqual({ in: ['active', 'trialing'] });
    expect(arg.where.OR).toHaveLength(2);
    expect(arg.where.OR[0]).toEqual({ currentPeriodEnd: null });
    expect(arg.where.OR[1]).toEqual(
      expect.objectContaining({
        currentPeriodEnd: expect.objectContaining({ gt: expect.any(BigInt) }),
      }),
    );
  });

  it('isPro is false when no paid sub and trial expired', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const findUnique = jest.fn().mockResolvedValue({
      id: userId,
      createdAt: BigInt(nowUnixSeconds() - 30 * 86_400),
    });
    const service = createService({
      subscription: { findFirst } as never,
      user: { findUnique } as never,
    });

    await expect(service.isPro(userId)).resolves.toBe(false);
  });
});
