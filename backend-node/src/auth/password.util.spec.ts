import { authenticate, encryptPassword, makeSalt } from './password.util';

describe('password.util', () => {
  it('encryptPassword returns lowercase hex', () => {
    const hash = encryptPassword('secret', '12345');
    expect(hash).toMatch(/^[0-9a-f]+$/);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('encryptPassword returns empty string for empty password or salt', () => {
    expect(encryptPassword('', 'salt')).toBe('');
    expect(encryptPassword('secret', '')).toBe('');
  });

  it('authenticate validates matching password', () => {
    const salt = 'test-salt';
    const hash = encryptPassword('mypassword', salt);
    expect(authenticate('mypassword', salt, hash)).toBe(true);
    expect(authenticate('wrong', salt, hash)).toBe(false);
  });

  it('authenticate rejects empty inputs', () => {
    expect(authenticate('', 'salt', 'hash')).toBe(false);
    expect(authenticate('pw', '', 'hash')).toBe(false);
    expect(authenticate('pw', 'salt', '')).toBe(false);
  });

  it('makeSalt returns a non-empty hex string from CSPRNG', () => {
    const salt = makeSalt();
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(makeSalt()).not.toBe(salt);
  });
});
