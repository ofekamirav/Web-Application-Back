import request from 'supertest';
import { app } from './setup';

describe('Recipes API Endpoints', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        name: 'Recipe Author',
        email: 'author@example.com',
        password: 'Password123!',
      });
    userId = registerRes.body.user._id;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'author@example.com',
        password: 'Password123!',
      });
    token = loginRes.body.accessToken;
  });

  describe('POST /recipes', () => {
    it('should create a new recipe with a valid token', async () => {
      const res = await request(app)
        .post('/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'My Test Recipe',
          description: 'A delicious test recipe.',
          ingredients: ['ingredient 1', 'ingredient 2'],
          instructions: 'Mix everything together.',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.title).toBe('My Test Recipe');
      expect(res.body.author).toBe(userId); // The author ID should be automatically set
    });

    it('should fail to create a recipe without a token (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/recipes')
        .send({ title: 'Unauthorized Recipe' });
      expect(res.statusCode).toEqual(401);
    });

    it('should fail to create a recipe with an invalid token (403 Forbidden)', async () => {
        const res = await request(app)
          .post('/recipes')
          .set('Authorization', 'Bearer invalidtoken')
          .send({ title: 'Invalid Token Recipe' });
        expect(res.statusCode).toEqual(403);
      });
  });

  describe('PUT /recipes/:id', () => {
    let recipeId: string;

    beforeEach(async () => {
        const recipeRes = await request(app)
            .post('/recipes')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Recipe to Update', description: 'desc', ingredients: ['i'], instructions: 'i' });
        recipeId = recipeRes.body._id;
    });

    it('should allow the author to update their own recipe', async () => {
        const updateRes = await request(app)
            .put(`/recipes/${recipeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated Title' });

        expect(updateRes.statusCode).toEqual(200);
        expect(updateRes.body.title).toBe('Updated Title');
    });

    it('should not allow a different user to update a recipe (403)', async () => {
        await request(app).post('/auth/register').send({ name: 'Hacker', email: 'hacker@example.com', password: 'Password123!' });
        const hackerLogin = await request(app).post('/auth/login').send({ email: 'hacker@example.com', password: 'Password123!' });
        const hackerToken = hackerLogin.body.accessToken;

        // Try to update the first user's recipe with the second user's token
        const updateRes = await request(app)
            .put(`/recipes/${recipeId}`)
            .set('Authorization', `Bearer ${hackerToken}`)
            .send({ title: 'Hacked Title' });

        expect(updateRes.statusCode).toEqual(403);
    });
  });
});
