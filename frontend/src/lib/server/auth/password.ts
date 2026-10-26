import { hash, verify } from '@node-rs/bcrypt';

const BCRYPT_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return hash(password, { cost: BCRYPT_COST });
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return verify(password, passwordHash);
}
