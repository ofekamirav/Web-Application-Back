import request from 'supertest';
import { app } from './setup';

const testUser = {
  name: 'Testing User',
  email: 'test@example.com',
  password: 'Password123!',
};

describe('Auth API Endpoints', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully and return tokens', async () => {
      const res = await request(app).post('/auth/register').send(testUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should fail to register with an existing email (409 Conflict)', async () => {
      await request(app).post('/auth/register').send(testUser);
      const res = await request(app).post('/auth/register').send(testUser);
      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/auth/register').send(testUser);
    });

    it('should log in an existing user successfully', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should fail with incorrect password (401 Unauthorized)', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /auth/refresh & /auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).post('/auth/register').send(testUser);
      const loginRes = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      refreshToken = loginRes.body.refreshToken;
    });

    it('should refresh tokens successfully and rotate the refresh token', async () => {
      const res = await request(app).post('/auth/refresh').send({ refreshToken });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.refreshToken).not.toBe(refreshToken); 
    });

    it('should fail to use a refresh token more than once (Token Rotation)', async () => {
      await request(app).post('/auth/refresh').send({ refreshToken }); 
      const second = await request(app).post('/auth/refresh').send({ refreshToken }); 
      expect(second.statusCode).toBe(403);
    });

    it('should fail to refresh with an invalid refresh token (403 Forbidden)', async () => {
      const res = await request(app).post('/auth/refresh').send({ refreshToken: 'invalidtoken' });
      expect(res.statusCode).toBe(403);
    });
  });
});
