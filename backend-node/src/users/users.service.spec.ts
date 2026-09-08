import { NotFoundError } from '../common/errors/http-errors';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService ownership', () => {
  const selfId = 'user-self';
  const otherId = 'user-other';

  function createService(prisma: Partial<PrismaService>): UsersService {
    return new UsersService(prisma as PrismaService);
  }

  it('listSelf returns only the actor', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: selfId,
      email: 'a@b.com',
      name: 'A',
      firstName: 'A',
      lastName: 'B',
      createdAt: BigInt(1),
      updatedAt: BigInt(1),
    });
    const service = createService({ user: { findUnique } as never });
    const users = await service.listSelf(selfId);
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(selfId);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: selfId } });
  });

  it('getUser refuses other users without leaking existence', async () => {
    const service = createService({ user: { findUnique: jest.fn() } as never });
    await expect(service.getUser(selfId, otherId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('updateUser refuses other users', async () => {
    const service = createService({ user: { findUnique: jest.fn() } as never });
    await expect(
      service.updateUser(selfId, otherId, { first_name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deleteUser refuses other users', async () => {
    const service = createService({ user: { findUnique: jest.fn() } as never });
    await expect(service.deleteUser(selfId, otherId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
