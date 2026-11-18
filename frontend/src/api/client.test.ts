import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, toQuery } from './client';

afterEach(() => vi.unstubAllGlobals());

describe('toQuery', () => {
  it('skips empty values and encodes the rest', () => {
    expect(toQuery({ q: 'a b', country: '', level: undefined, page: 2 })).toBe('?q=a+b&page=2');
    expect(toQuery({})).toBe('');
  });
});

describe('api client', () => {
  it('turns an error envelope into an ApiError with field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Validation failed', details: [{ field: 'email', message: 'Invalid email' }] } }), { status: 400 })));
    const err: ApiError = await api.get('/x').then(() => { throw new Error('expected failure'); }, (e: ApiError) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.fieldErrors).toEqual({ email: 'Invalid email' });
  });

  it('reports network failures in plain language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(api.get('/x')).rejects.toMatchObject({ code: 'NETWORK' });
  });
});
