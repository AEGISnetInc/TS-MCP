// src/crypto/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.TS_MCP_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error('TS_MCP_ENCRYPTION_KEY environment variable is not set');
  }
  return Buffer.from(keyBase64, 'base64');
}

/**
 * Encrypts a string using AES-256-GCM.
 * Returns base64-encoded string containing IV + ciphertext + auth tag.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  // Combine: IV (16) + ciphertext + authTag (16)
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString('base64');
}

/**
 * Decrypts a string that was encrypted with encrypt().
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}
