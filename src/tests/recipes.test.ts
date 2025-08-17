import request from 'supertest';
import { app } from './setup';

const unique = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const mkUser = () => ({
  name: 'Chef Tester',
  email: unique('chef'),
  password: 'Password123!',
});

async function auth() {
  const u = mkUser();
  await request(app).post('/auth/register').send(u).expect(201);
  const login = await request(app).post('/auth/login').send({ email: u.email, password: u.password }).expect(200);
  return { token: login.body.accessToken, user: login.body.user };
}

async function createRecipe(token: string) {
  const payload = {
    title: 'Pasta Test',
    description: 'Tasty pasta',
    instructions: 'Boil water; add pasta',
    ingredients: JSON.stringify(['200g pasta', 'Water', 'Salt']),
    imageUrl: '/storage/recipes/sample.jpg',
  };
  const res = await request(app)
    .post('/recipes')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  expect(res.status).toBe(201);
  return res.body;
}

describe('Recipes routes', () => {
  describe('GET /recipes', () => {
    it('200 – returns paginated list', async () => {
      const res = await request(app).get('/recipes');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /recipes', () => {
    it('201 – creates a recipe (auth)', async () => {
      const { token } = await auth();
      const recipe = await createRecipe(token);
      expect(recipe).toHaveProperty('_id');
      expect(recipe).toHaveProperty('title', 'Pasta Test');
    });

    it('401 – creating without token is blocked', async () => {
      const res = await request(app).post('/recipes').send({
        title: 'No Token',
        description: 'Should fail',
        instructions: '—',
        ingredients: JSON.stringify(['x']),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /recipes/mine', () => {
    it('200 – returns my recipes', async () => {
      const { token } = await auth();
      await createRecipe(token);
      const res = await request(app).get('/recipes/mine').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /recipes/:id, PUT /recipes/:id, PUT /recipes/:id/image, POST /recipes/:id/like, DELETE /recipes/:id', () => {
    it('happy path for full lifecycle', async () => {
      const { token, user } = await auth();

      const created = await createRecipe(token);

      const got = await request(app).get(`/recipes/${created._id}`);
      expect(got.status).toBe(200);
      expect(got.body).toHaveProperty('_id', created._id);

      const updated = await request(app)
        .put(`/recipes/${created._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Pasta' });
      expect(updated.status).toBe(200);
      expect(updated.body).toHaveProperty('title', 'Updated Pasta');
      expect(updated.body).toHaveProperty('author');
      expect(updated.body.author._id || updated.body.author).toBe(user._id);

      const upImg = await request(app)
        .put(`/recipes/${created._id}/image`)
        .set('Authorization', `Bearer ${token}`)
        .send({ imageUrl: '/storage/recipes/new.jpg' });
      expect([200, 400]).toContain(upImg.statusCode); 
      if (upImg.statusCode === 200) {
        expect(upImg.body).toHaveProperty('imageUrl', '/storage/recipes/new.jpg');
      }

      const liked = await request(app)
        .post(`/recipes/${created._id}/like`)
        .set('Authorization', `Bearer ${token}`);
      expect(liked.status).toBe(200);
      expect(liked.body).toHaveProperty('_id', created._id);

      const del = await request(app)
        .delete(`/recipes/${created._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(del.status).toBe(204);

      const after = await request(app).get(`/recipes/${created._id}`);
      expect(after.status).toBe(404);
    });

    it('403 – updating recipe by non-owner is forbidden', async () => {
      const a = await auth();
      const created = await createRecipe(a.token);

      const b = await auth();
      const res = await request(app)
        .put(`/recipes/${created._id}`)
        .set('Authorization', `Bearer ${b.token}`)
        .send({ title: 'Hack' });

      expect([403, 404]).toContain(res.statusCode); 
    });
  });
});
