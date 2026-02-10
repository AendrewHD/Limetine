import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GET } from './route';

describe('GET /api/status', () => {
  it('should return 200 OK and status: "ok"', async () => {
    const response = await GET();
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.deepStrictEqual(data, { status: 'ok' });
  });
});
