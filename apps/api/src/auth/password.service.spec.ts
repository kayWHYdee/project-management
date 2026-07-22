import { describe, expect, it } from 'vitest';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes to an argon2id string and verifies the correct password', async () => {
    const hash = await service.hash('correct horse');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await service.verify(hash, 'correct horse')).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await service.hash('correct horse');
    expect(await service.verify(hash, 'wrong horse')).toBe(false);
  });

  it('returns false for a malformed hash instead of throwing', async () => {
    expect(await service.verify('not-a-hash', 'anything')).toBe(false);
  });
});
