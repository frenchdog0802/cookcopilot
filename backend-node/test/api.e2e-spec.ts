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

describe('API surface (e2e)', () => {
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

  it('GET /api/health — bare UP payload', async () => {
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

  it('GET /api/subscription/plans — public catalog', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/subscription/plans')
      .expect(200);

    const body = response.body as ApiEnvelope<{
      plans: unknown[];
      trialDays: number;
    }>;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.plans)).toBe(true);
    expect(body.data.trialDays).toBeGreaterThan(0);
  });

  it('GET /api/chat/actions — requires auth', async () => {
    await request(app.getHttpServer()).get('/api/chat/actions').expect(401);
  });

  (dbAvailable ? describe : describe.skip)(
    'authenticated CRUD round-trips',
    () => {
      let token: string;
      let userId: string;
      let folderId: string;
      let ingredientId: string;
      let recipeId: string;
      let pantryItemId: string;
      let shoppingItemId: string;
      let mealPlanId: string;

      beforeAll(async () => {
        const email = `api-e2e-${Date.now()}@example.com`;
        const signup = await request(app.getHttpServer())
          .post('/api/auth/signup')
          .send({
            first_name: 'API',
            last_name: 'E2E',
            email,
            password: 'secret123',
          })
          .expect(200);

        const signupBody = signup.body as ApiEnvelope<{
          token: string;
          user: { id: string };
        }>;
        token = signupBody.data.token;
        userId = signupBody.data.user.id;
      });

      const auth = () => ({
        Authorization: `Bearer ${token}`,
      });

      it('GET /api/chat/actions', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/chat/actions')
          .set(auth())
          .expect(200);

        const body = response.body as ApiEnvelope<{ actions: string[] }>;
        expect(body.data.actions).toContain('listMyRecipes');
      });

      it('GET /api/subscription/status', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/subscription/status')
          .set(auth())
          .expect(200);

        const body = response.body as ApiEnvelope<{ isPro: boolean }>;
        expect(typeof body.data.isPro).toBe('boolean');
      });

      it('GET /api/user-preferences', async () => {
        await request(app.getHttpServer())
          .get('/api/user-preferences')
          .set(auth())
          .expect(200);
      });

      it('folder CRUD', async () => {
        const create = await request(app.getHttpServer())
          .post('/api/folder')
          .set(auth())
          .send({ name: 'E2E Folder' })
          .expect(200);

        folderId = (create.body as ApiEnvelope<{ folder: { id: string } }>).data
          .folder.id;

        await request(app.getHttpServer())
          .get('/api/folder')
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .get(`/api/folder/${folderId}`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .put(`/api/folder/${folderId}`)
          .set(auth())
          .send({ name: 'E2E Folder Updated' })
          .expect(200);
      });

      it('ingredient CRUD + bulk', async () => {
        const create = await request(app.getHttpServer())
          .post('/api/ingredient')
          .set(auth())
          .send({ name: 'E2E Tomato', default_unit: 'pcs' })
          .expect(200);

        ingredientId = (
          create.body as ApiEnvelope<{ ingredient: { id: string } }>
        ).data.ingredient.id;

        await request(app.getHttpServer())
          .post('/api/ingredient/bulk')
          .set(auth())
          .send({
            ingredients: [{ name: 'E2E Onion', default_unit: 'pcs' }],
          })
          .expect(200);

        await request(app.getHttpServer())
          .get('/api/ingredient')
          .set(auth())
          .expect(200);
      });

      it('recipe CRUD', async () => {
        const create = await request(app.getHttpServer())
          .post('/api/recipe')
          .set(auth())
          .send({
            meal_name: 'E2E Pasta',
            folder_id: folderId,
            instructions: 'Boil and serve',
            ingredients: [
              {
                name: 'E2E Tomato',
                quantity: 2,
                unit: 'pcs',
              },
            ],
          })
          .expect(200);

        recipeId = (create.body as ApiEnvelope<{ recipe: { id: string } }>).data
          .recipe.id;

        await request(app.getHttpServer())
          .get('/api/recipe')
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .get(`/api/recipe/${recipeId}`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .put(`/api/recipe/${recipeId}`)
          .set(auth())
          .send({ meal_name: 'E2E Pasta Updated' })
          .expect(200);
      });

      it('pantry-item CRUD + bulk', async () => {
        const create = await request(app.getHttpServer())
          .post('/api/pantry-item')
          .set(auth())
          .send({
            ingredient_id: ingredientId,
            quantity: 3,
            unit: 'pcs',
          })
          .expect(200);

        pantryItemId = (create.body as ApiEnvelope<{ item: { id: string } }>)
          .data.item.id;

        await request(app.getHttpServer())
          .post('/api/pantry-item/bulk')
          .set(auth())
          .send({
            pantry_items: [
              { ingredient_id: ingredientId, quantity: 1, unit: 'pcs' },
            ],
          })
          .expect(200);

        await request(app.getHttpServer())
          .get('/api/pantry-item')
          .set(auth())
          .expect(200);
      });

      it('shopping-list CRUD + bulk', async () => {
        const create = await request(app.getHttpServer())
          .post('/api/shopping-list')
          .set(auth())
          .send({
            ingredient_id: ingredientId,
            quantity: 1,
            unit: 'pcs',
          })
          .expect(200);

        shoppingItemId = (create.body as ApiEnvelope<{ item: { id: string } }>)
          .data.item.id;

        await request(app.getHttpServer())
          .post('/api/shopping-list/bulk')
          .set(auth())
          .send({
            shopping_list_items: [
              { ingredient_id: ingredientId, quantity: 2, unit: 'pcs' },
            ],
          })
          .expect(200);

        await request(app.getHttpServer())
          .get('/api/shopping-list')
          .set(auth())
          .expect(200);
      });

      it('meal-plan CRUD + pending-confirm + skip', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const servingDate = yesterday.toISOString().slice(0, 10);

        const create = await request(app.getHttpServer())
          .post('/api/meal-plan')
          .set(auth())
          .send({
            recipe_id: recipeId,
            meal_type: 'dinner',
            serving_date: servingDate,
          })
          .expect(200);

        mealPlanId = (create.body as ApiEnvelope<{ mealPlan: { id: string } }>)
          .data.mealPlan.id;

        await request(app.getHttpServer())
          .get('/api/meal-plan')
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .get('/api/meal-plan/pending-confirm')
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .get(`/api/meal-plan/${mealPlanId}`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .post(`/api/meal-plan/${mealPlanId}/skip`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .put(`/api/meal-plan/${mealPlanId}`)
          .set(auth())
          .send({ meal_type: 'lunch' })
          .expect(200);
      });

      it('chat sessions + history GET + DELETE', async () => {
        const sessionsRes = await request(app.getHttpServer())
          .get('/api/chat/sessions')
          .set(auth())
          .expect(200);

        const sessionsBody = sessionsRes.body as ApiEnvelope<{
          sessions: Array<{ id: string; isDefault: boolean }>;
        }>;
        expect(sessionsBody.success).toBe(true);
        expect(sessionsBody.data.sessions.length).toBeGreaterThan(0);
        const sessionId = sessionsBody.data.sessions[0].id;

        const created = await request(app.getHttpServer())
          .post('/api/chat/sessions')
          .set(auth())
          .send({ title: 'E2E chat' })
          .expect(200);
        const createdBody = created.body as ApiEnvelope<{
          id: string;
          title: string;
        }>;
        expect(createdBody.data.title).toBe('E2E chat');

        await request(app.getHttpServer())
          .get(`/api/chat/history?sessionId=${sessionId}`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .delete(`/api/chat/history?sessionId=${sessionId}`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .delete(`/api/chat/sessions/${createdBody.data.id}`)
          .set(auth())
          .expect(200);
      });

      it('users list includes self', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users')
          .set(auth())
          .expect(200);

        const body = response.body as ApiEnvelope<{
          users: Array<{ id: string }>;
        }>;
        expect(body.data.users.some((user) => user.id === userId)).toBe(true);
      });

      it('cleanup resources', async () => {
        await request(app.getHttpServer())
          .delete(`/api/meal-plan/${mealPlanId}`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .delete(`/api/shopping-list/${shoppingItemId}`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .delete(`/api/pantry-item/${pantryItemId}`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .delete(`/api/recipe/${recipeId}`)
          .set(auth())
          .expect(200);

        await request(app.getHttpServer())
          .delete(`/api/folder/${folderId}`)
          .set(auth())
          .expect(200);
      });

      it('POST /api/auth/signout', async () => {
        await request(app.getHttpServer())
          .get('/api/auth/signout')
          .set(auth())
          .expect(200);
      });
    },
  );
});
