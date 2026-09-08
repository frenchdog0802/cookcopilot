import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/** CSPRNG salt (hex). Existing DB rows may still use older numeric salts. */
export function makeSalt(): string {
  return randomBytes(16).toString('hex');
}

export function encryptPassword(password: string, salt: string): string {
  if (!password || !salt) {
    return '';
  }
  return createHmac('sha1', salt).update(password, 'utf8').digest('hex');
}

export function authenticate(
  plainPassword: string,
  salt: string,
  hashedPassword: string,
): boolean {
  if (!plainPassword || !salt || !hashedPassword) {
    return false;
  }
  const candidate = encryptPassword(plainPassword, salt);
  if (candidate.length !== hashedPassword.length) {
    return false;
  }
  try {
    return timingSafeEqual(
      Buffer.from(candidate, 'utf8'),
      Buffer.from(hashedPassword, 'utf8'),
    );
  } catch {
    return false;
  }
}
