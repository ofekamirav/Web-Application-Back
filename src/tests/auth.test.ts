import request from 'supertest';
import { app } from './setup';

const unique = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const mkUser = () => ({
  name: 'Testing User',
  email: unique('test'),
  password: 'Password123!',
});

describe('Auth routes', () => {
  describe('POST /auth/register', () => {
    it('201 – registers a new user and returns tokens', async () => {
      const user = mkUser();
      const res = await request(app).post('/auth/register').send(user);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(user.email);
    });

    it('409 – duplicate email', async () => {
      const user = mkUser();
      await request(app).post('/auth/register').send(user).expect(201);
      const res = await request(app).post('/auth/register').send(user);
      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    const user = mkUser();

    beforeAll(async () => {
      await request(app).post('/auth/register').send(user).expect(201);
    });

    it('200 – logs in and returns tokens', async () => {
      const res = await request(app).post('/auth/login').send({
        email: user.email,
        password: user.password,
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('401 – wrong password', async () => {
      const res = await request(app).post('/auth/login').send({
        email: user.email,
        password: 'Wrong123!',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/google-signin', () => {
    it('400 – missing credential', async () => {
      const res = await request(app).post('/auth/google-signin').send({});
      expect(res.status).toBe(400);
    });

    it('400/401 – invalid credential', async () => {
      const res = await request(app)
        .post('/auth/google-signin')
        .send({ credential: 'totally-invalid-id-token' });
      expect([400, 401]).toContain(res.statusCode);
    });
  });

  describe('POST /auth/refresh & /auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const u = mkUser();
      await request(app).post('/auth/register').send(u).expect(201);
      const login = await request(app)
        .post('/auth/login')
        .send({ email: u.email, password: u.password })
        .expect(200);
      refreshToken = login.body.refreshToken;
    });

    it('200 – refresh returns new access & rotated refresh', async () => {
      const res = await request(app).post('/auth/refresh').send({ refreshToken });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it('403 – cannot reuse old refresh token (rotation)', async () => {
      await request(app).post('/auth/refresh').send({ refreshToken }).expect(200);
      const res = await request(app).post('/auth/refresh').send({ refreshToken });
      expect(res.statusCode).toBe(403);
    });

    it('403 – invalid refresh token', async () => {
      const res = await request(app).post('/auth/refresh').send({ refreshToken: 'bad' });
      expect(res.statusCode).toBe(403);
    });

    it('204 – logout', async () => {
      const res = await request(app).post('/auth/logout').send({ refreshToken });
      expect(res.statusCode).toBe(204);
    });
  });
});
