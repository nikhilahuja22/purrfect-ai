import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ENCRYPTION_KEY } from '$app/env/private';

// AES-256-GCM. The 16-byte auth tag is stored in its own column, not appended to the ciphertext.
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

export type SealedSecret = { ciphertext: string; iv: string; authTag: string };

// Read on every call (not at import time) so a missing key only fails the request that needs it.
function masterKey(): Buffer {
  const raw = Buffer.from(ENCRYPTION_KEY ?? '', 'base64');
  if (raw.length !== KEY_BYTES) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes, base64 encoded. See .env.example.');
  }
  return raw;
}

// A fresh random IV is generated for every call, so the same key never encrypts with the same IV.
export function encryptSecret(plaintext: string): SealedSecret {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, masterKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64')
  };
}

// Throws if the ciphertext, IV, or auth tag was altered, or if the master key is wrong.
export function decryptSecret(sealed: SealedSecret): string {
  const decipher = createDecipheriv(ALGORITHM, masterKey(), Buffer.from(sealed.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(sealed.authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, 'base64')),
    decipher.final()
  ]).toString('utf8');
}
