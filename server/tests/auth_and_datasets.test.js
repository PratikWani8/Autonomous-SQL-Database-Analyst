const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const DatasetMetadata = require('../src/models/DatasetMetadata');
const { MONGODB_URI } = require('../src/config/env');

beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);
});

afterAll(async () => {
  // Clean up test user
  await User.deleteMany({ email: /test.*@example\.com/ });
  await mongoose.connection.close();
});

describe('Authentication & User Lifecycle APIs', () => {
  const testUser = {
    name: 'Test Analyst',
    email: `test_${Date.now()}@example.com`,
    password: 'Password123!',
    preferredLanguage: 'en'
  };

  let authToken = '';

  test('POST /api/auth/register should create a new user and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    authToken = res.body.token;
  });

  test('POST /api/auth/register should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login should authenticate valid user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrong_password_123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me should return current user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
  });

  test('GET /api/auth/me should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Dataset Exploration APIs', () => {
  test('GET /api/datasets should return list of public Indian datasets', async () => {
    const res = await request(app).get('/api/datasets');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/datasets/:id/schema should return dataset column structure', async () => {
    const res = await request(app).get('/api/datasets/district_unemployment_stats/schema');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tableName).toBe('district_unemployment_stats');
    expect(Array.isArray(res.body.columns)).toBe(true);
  });

  test('GET /api/datasets/invalid_table/schema should return 404', async () => {
    const res = await request(app).get('/api/datasets/non_existent_dataset/schema');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Analytics Question Validation APIs', () => {
  test('POST /api/analytics/query should require minimum 3 characters', async () => {
    // Register temporary user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Query Validator',
        email: `validator_${Date.now()}@example.com`,
        password: 'Password123!'
      });

    const token = regRes.body.token;

    const res = await request(app)
      .post('/api/analytics/query')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'hi' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
