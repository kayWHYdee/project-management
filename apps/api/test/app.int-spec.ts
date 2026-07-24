import { execSync } from 'node:child_process';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service';
import { PasswordService } from '../src/auth/password.service';

/**
 * API integration tests: the real NestJS app (guards, filter, Prisma, audit) run
 * against a fresh Postgres from Testcontainers with the real migrations applied.
 * Requires Docker. Run with: pnpm --filter @water-pm/api test:int
 */
describe('API integration', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16').start();
    process.env.DATABASE_URL = `${container.getConnectionUri()}?schema=pm`;
    process.env.SESSION_SECRET = 'integration-test-session-secret';
    process.env.NODE_ENV = 'test';
    process.env.COOKIE_SECURE = 'false';

    execSync('pnpm exec prisma migrate deploy', { env: process.env, stdio: 'inherit' });

    // Imported after env is set: ConfigModule validates the environment eagerly.
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser(process.env.SESSION_SECRET));
    await app.init();

    prisma = app.get(PrismaService);
    const hash = await app.get(PasswordService).hash('secret123');
    await prisma.user.createMany({
      data: [
        { name: 'Owner', email: 'owner@test.com', passwordHash: hash, role: 'OWNER' },
        { name: 'Viewer', email: 'viewer@test.com', passwordHash: hash, role: 'VIEWER' },
      ],
    });
  });

  afterAll(async () => {
    await app?.close();
    await container?.stop();
  });

  const login = async (email: string) => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password: 'secret123' });
    return agent;
  };

  it('logs in and returns the session user from /auth/me', async () => {
    const agent = await login('owner@test.com');
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email: 'owner@test.com', role: 'OWNER' });
  });

  it('rejects a wrong password with a generic 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('forbids a VIEWER from writing but lets an OWNER, recording an audit row', async () => {
    const viewer = await login('viewer@test.com');
    const forbidden = await viewer.post('/api/clients').send({ name: 'Nope' });
    expect(forbidden.status).toBe(403);

    const owner = await login('owner@test.com');
    const created = await owner.post('/api/clients').send({ name: 'Acme Integration' });
    expect(created.status).toBe(201);

    const audit = await prisma.auditLog.findFirst({
      where: { entity: 'Client', entityId: created.body.id, action: 'CREATE' },
    });
    expect(audit).not.toBeNull();
  });

  it('forbids a non-OWNER from listing users', async () => {
    const viewer = await login('viewer@test.com');
    const res = await viewer.get('/api/users');
    expect(res.status).toBe(403);
  });

  it('validates payloads via the shared Zod schema (400 with field errors)', async () => {
    const owner = await login('owner@test.com');
    const res = await owner.post('/api/clients').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION');
    expect(res.body.fieldErrors).toHaveProperty('name');
  });
});
