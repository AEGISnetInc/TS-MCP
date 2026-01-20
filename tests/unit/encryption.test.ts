// tests/unit/encryption.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('Encryption', () => {
  const testKey = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64'); // 32 bytes

  beforeEach(() => {
    process.env.TS_MCP_ENCRYPTION_KEY = testKey;
  });

  describe('encrypt and decrypt', () => {
    it('round-trips a string value', async () => {
      const { encrypt, decrypt } = await import('../../src/crypto/encryption.js');
      const plaintext = 'my-secret-api-key';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('produces different ciphertext each time (unique IV)', async () => {
      const { encrypt } = await import('../../src/crypto/encryption.js');
      const plaintext = 'my-secret-api-key';

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('throws if encryption key is not set', async () => {
      delete process.env.TS_MCP_ENCRYPTION_KEY;

      // Re-import to pick up env change
      jest.resetModules();
      const { encrypt } = await import('../../src/crypto/encryption.js');

      expect(() => encrypt('test')).toThrow('TS_MCP_ENCRYPTION_KEY');
    });
  });
});
