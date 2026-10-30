import request from 'supertest';
import { app } from '../src/index.js';

describe('auth', () => {
  it('registers and logs in a user', async () => {
    const payload = { name: 'Jules', email: 'jules@example.com', password: 'Password123' };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(payload)
      .expect(201);

    expect(registerResponse.body.user.email).toBe('jules@example.com');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jules@example.com', password: 'Password123' })
      .expect(200);

    expect(loginResponse.body.user.email).toBe('jules@example.com');
  });
});
