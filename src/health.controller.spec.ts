import { createHealthController } from './health.controller';

describe('HealthController', () => {
  it('returns an ok status and timestamp', () => {
    const result = createHealthController().check();
    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
