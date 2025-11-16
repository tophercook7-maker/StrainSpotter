import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

const adminErrorsData = [
  {
    id: 'err-1',
    created_at: '2025-11-15T00:00:00Z',
    path: '/api/test',
    method: 'GET',
    status_code: 500,
    message: 'Boom',
    stack: 'Error: Boom'
  }
];

const adminErrorsQuery = {
  select: vi.fn(() => adminErrorsQuery),
  order: vi.fn(() => adminErrorsQuery),
  limit: vi.fn(() => Promise.resolve({ data: adminErrorsData, error: null })),
  insert: vi.fn(() => Promise.resolve({ error: null }))
};

const profilesQuery = {
  select: vi.fn(() => profilesQuery),
  eq: vi.fn(() => profilesQuery),
  maybeSingle: vi.fn(() =>
    Promise.resolve({
      data: { user_id: 'admin-user', role: 'admin', email: 'topher.cook7@gmail.com' },
      error: null
    })
  )
};

vi.mock('../supabaseAdmin.js', () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === 'admin_errors') return adminErrorsQuery;
      if (table === 'profiles') return profilesQuery;
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) })
      };
    }
  },
  supabaseUrl: 'https://example.supabase.co',
  supabaseServiceRoleKey: 'service-role-key',
  ensureBucketExists: () => Promise.resolve({ ok: true, created: false })
}));

vi.mock('../supabaseClient.js', () => {
  const authGetUser = vi.fn((token) => {
    if (token === 'admin-token') {
      return Promise.resolve({
        data: { user: { id: 'admin-user', email: 'topher.cook7@gmail.com' } },
        error: null
      });
    }
    return Promise.resolve({
      data: { user: null },
      error: new Error('invalid token')
    });
  });
  globalThis.__supabaseAuthGetUser = authGetUser;
  return {
    supabase: {
      auth: {
        getUser: authGetUser
      }
    }
  };
});

import app from '../index.js';

describe('admin errors API', () => {
  beforeEach(() => {
    adminErrorsQuery.select.mockClear();
    adminErrorsQuery.order.mockClear();
    adminErrorsQuery.limit.mockClear();
    adminErrorsQuery.insert.mockClear();
    profilesQuery.select.mockClear();
    profilesQuery.eq.mockClear();
    profilesQuery.maybeSingle.mockClear();
    if (globalThis.__supabaseAuthGetUser) {
      globalThis.__supabaseAuthGetUser.mockClear();
    }
  });

  it('rejects unauthenticated access to recent errors', async () => {
    const res = await request(app).get('/api/admin/errors/recent');
    expect(res.status).toBe(401);
  });

  it('returns recent errors for admins', async () => {
    const res = await request(app)
      .get('/api/admin/errors/recent')
      .set('Authorization', 'Bearer admin-token');
    expect(res.status).toBe(200);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].path).toBe('/api/test');
  });

  it('logs client-side crashes', async () => {
    const payload = {
      message: 'Client explosion',
      stack: 'ReferenceError',
      location: 'http://localhost:5173/foo',
      currentView: '/foo',
      userAgent: 'Vitest',
      platform: 'test'
    };

    const res = await request(app)
      .post('/api/admin/errors/client')
      .send(payload);

    expect(res.status).toBe(200);
    expect(adminErrorsQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Client explosion',
        method: 'CLIENT',
        context: {
          client: expect.objectContaining({
            currentView: '/foo',
            userAgent: 'Vitest'
          })
        }
      })
    );
  });
});


