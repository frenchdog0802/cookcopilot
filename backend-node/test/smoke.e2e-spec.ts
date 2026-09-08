import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.schema';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type AuthData = {
  token: string;
  user: { email: string };
};

type FolderData = {
  folder: { name: string };
};

type FoldersData = {
  folders: Array<{ name: string }>;
};

describe('Integration smoke (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let dbAvailable = false;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const configService = app.get(ConfigService);
    const appConfig = configService.get<AppConfig>('app');
    if (appConfig) {
      configureApp(app, appConfig);
    }
    await app.init();

    prisma = app.get(PrismaService);
    dbAvailable = prisma.isDatabaseAvailable();
    if (dbAvailable) {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch {
        dbAvailable = false;
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns bare UP payload without auth', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    const body = response.body as {
      status?: string;
      timestamp?: number;
      success?: boolean;
    };
    expect(body).toEqual(
      expect.objectContaining({
        status: 'UP',
        timestamp: expect.any(Number) as number,
      }),
    );
    expect(body.success).toBeUndefined();
  });

  (dbAvailable ? it : it.skip)(
    'signup then create folder roundtrip',
    async () => {
      const email = `smoke-${Date.now()}@example.com`;
      const signupResponse = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          first_name: 'Smoke',
          last_name: 'Test',
          email,
          password: 'secret123',
        })
        .expect(200);

      const signupBody = signupResponse.body as ApiEnvelope<AuthData>;
      expect(signupBody.success).toBe(true);
      expect(signupBody.data.token).toBeTruthy();
      expect(signupBody.data.user.email).toBe(email);

      const token = signupBody.data.token;

      const folderResponse = await request(app.getHttpServer())
        .post('/api/folder')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Smoke Folder' })
        .expect(200);

      const folderBody = folderResponse.body as ApiEnvelope<FolderData>;
      expect(folderBody.success).toBe(true);
      expect(folderBody.data.folder.name).toBe('Smoke Folder');

      const listResponse = await request(app.getHttpServer())
        .get('/api/folder')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const listBody = listResponse.body as ApiEnvelope<FoldersData>;
      expect(listBody.success).toBe(true);
      expect(listBody.data.folders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Smoke Folder' }),
        ]),
      );
    },
  );
});
