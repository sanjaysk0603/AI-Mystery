import { jest } from '@jest/globals';

const suspect = (id) => ({ id, name: `Suspect ${id}`, age: 30, role: 'Archivist', publicBio: 'Keeps the records.', portraitUrl: 'placeholder' });
const message = { sender: 'Suspect s1', text: 'I was near the hall.', timestamp: '20:00', type: 'text' };
const caseFixture = {
  public: {
    title: 'The Missing Necklace', briefing: 'A necklace vanished during a busy and rainy birthday gathering at the fictional Northbridge college hostel.', setting: { place: 'Northbridge', date: '2026-05-14', timeWindow: '19:30-22:15' },
    suspects: ['s1', 's2', 's3', 's4'].map(suspect),
    chats: [1, 2, 3].map((n) => ({ id: `chat-${n}`, title: `Chat ${n}`, participants: ['Suspect s1'], messages: [message] })),
    photos: [1, 2, 3, 4].map((n) => ({ id: `photo-${n}`, caption: `Evidence photo ${n}`, timestamp: '20:00', location: 'Hall', imageUrl: 'placeholder', imageStatus: 'placeholder' })),
    cctv: [1, 2].map((n) => ({ id: `camera-${n}`, cameraName: `Camera ${n}`, location: 'Hall', frames: [1, 2, 3, 4].map((i) => ({ offsetSeconds: i * 5, timestamp: '20:00', caption: 'A figure crosses the corridor.', imageUrl: 'placeholder' })) })),
  },
  secret: {
    culpritId: 's2', motive: 'The culprit needed money.', method: 'They used the blackout.', timeline: [{ time: '20:00', event: 'The necklace disappeared.', truth: true }],
    keyClues: [{ id: 'k1', description: 'A message contradicts the alibi.', points: 's2', type: 'chat' }], redHerrings: [], hints: ['Check the timeline.', 'Review the private messages.', 'Compare the alibis.'], walkthrough: 'Two clues expose the lie.',
  },
};

jest.unstable_mockModule('../src/services/caseGenerator.js', () => ({
  generateMysteryCase: jest.fn(async () => caseFixture),
  validateCaseOutputs: jest.fn(() => true),
  validateSolvability: jest.fn(async () => true),
}));
jest.unstable_mockModule('../src/services/moderation.js', () => ({
  moderateScenario: jest.fn(async (scenario) => scenario.toLowerCase().includes('celebrity')
    ? { allowed: false, reason: 'Please rewrite the scenario without real people or unsafe content.' }
    : { allowed: true, reason: 'Scenario passed moderation.' }),
}));

const { app } = await import('../src/index.js');

async function register(email) {
  const response = await (await import('supertest')).default(app).post('/api/auth/register')
    .send({ name: 'Case Test', email, password: 'Password123' }).expect(201);
  return response.headers['set-cookie'][0].split(';')[0];
}

describe('case flow', () => {
  it('moderates input, returns 202, and withholds solution fields before verdict', async () => {
    const cookie = await register('case-test@example.com');
    const blocked = await (await import('supertest')).default(app).post('/api/cases').set('Cookie', cookie)
      .send({ scenario: 'A famous celebrity was robbed by a real person in an airport.' }).expect(400);
    expect(blocked.body.error.code).toBe('MODERATION_REJECTED');

    const created = await (await import('supertest')).default(app).post('/api/cases').set('Cookie', cookie)
      .send({ scenario: 'A necklace disappeared from a college hostel birthday party after the lights went out.' }).expect(202);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const visible = await (await import('supertest')).default(app).get(`/api/cases/${created.body.id}`).set('Cookie', cookie).expect(200);
    expect(visible.body.status).toBe('ready');
    expect(JSON.stringify(visible.body)).not.toMatch(/culpritId|motive|method/);
    expect(visible.body.public.suspects).toHaveLength(4);
  });

  it('allows one final accusation and reveals the solution afterward', async () => {
    const supertest = (await import('supertest')).default;
    const cookie = await register('accusation-test@example.com');
    const created = await supertest(app).post('/api/cases').set('Cookie', cookie)
      .send({ scenario: 'A necklace disappeared from a college hostel birthday party after the lights went out.' }).expect(202);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const accusation = { suspectId: 's2', justification: 'The message and camera timing contradict their alibi.' };
    const result = await supertest(app).post(`/api/cases/${created.body.id}/accuse`).set('Cookie', cookie).send(accusation).expect(200);
    expect(result.body.result.culpritId).toBe('s2');
    await supertest(app).post(`/api/cases/${created.body.id}/accuse`).set('Cookie', cookie).send(accusation).expect(409);
  });
});
