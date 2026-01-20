// tests/unit/cloud-auth-provider.test.ts
import { jest } from '@jest/globals';

// Create mock for decrypt function BEFORE importing modules that use it
const mockDecrypt = jest.fn<(encrypted: string) => string>();

jest.unstable_mockModule('../../src/crypto/encryption.js', () => ({
  decrypt: mockDecrypt
}));

// Import after mocks are set up
const { CloudAuthProvider } = await import('../../src/auth/cloud-auth-provider.js');
const { NotAuthenticatedError } = await import('../../src/utils/errors.js');

describe('CloudAuthProvider', () => {
  let mockSessionRepo: {
    findByToken: jest.Mock<(token: string) => Promise<{ id: string; api_key_enc: string } | null>>;
    updateLastUsed: jest.Mock<(token: string) => Promise<void>>;
  };
  let cloudAuthProvider: InstanceType<typeof CloudAuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSessionRepo = {
      findByToken: jest.fn(),
      updateLastUsed: jest.fn()
    };

    cloudAuthProvider = new CloudAuthProvider(mockSessionRepo as any);
  });

  describe('getApiKey', () => {
    it('returns decrypted API key for valid session', async () => {
      const mockSession = {
        id: 'session-123',
        api_key_enc: 'encrypted-api-key'
      };
      mockSessionRepo.findByToken.mockResolvedValue(mockSession);
      mockDecrypt.mockReturnValue('decrypted-api-key');

      const result = await cloudAuthProvider.getApiKey({ sessionToken: 'valid-token' });

      expect(result).toBe('decrypted-api-key');
      expect(mockSessionRepo.findByToken).toHaveBeenCalledWith('valid-token');
      expect(mockDecrypt).toHaveBeenCalledWith('encrypted-api-key');
      expect(mockSessionRepo.updateLastUsed).toHaveBeenCalledWith('valid-token');
    });

    it('throws NotAuthenticatedError when no session token provided', async () => {
      await expect(cloudAuthProvider.getApiKey({})).rejects.toThrow(NotAuthenticatedError);
      await expect(cloudAuthProvider.getApiKey()).rejects.toThrow(NotAuthenticatedError);
    });

    it('throws NotAuthenticatedError when session not found', async () => {
      mockSessionRepo.findByToken.mockResolvedValue(null);

      await expect(
        cloudAuthProvider.getApiKey({ sessionToken: 'invalid-token' })
      ).rejects.toThrow(NotAuthenticatedError);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true for valid session', async () => {
      mockSessionRepo.findByToken.mockResolvedValue({ id: 'session-123', api_key_enc: 'enc' });

      const result = await cloudAuthProvider.isAuthenticated({ sessionToken: 'valid-token' });

      expect(result).toBe(true);
    });

    it('returns false when no session token', async () => {
      const result = await cloudAuthProvider.isAuthenticated({});

      expect(result).toBe(false);
    });

    it('returns false when session not found', async () => {
      mockSessionRepo.findByToken.mockResolvedValue(null);

      const result = await cloudAuthProvider.isAuthenticated({ sessionToken: 'invalid-token' });

      expect(result).toBe(false);
    });
  });
});
