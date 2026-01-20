import { jest } from '@jest/globals';

// Create mocks BEFORE importing modules that use them
const mockGetApiKey = jest.fn<() => Promise<string | null>>();
const mockSetApiKey = jest.fn<() => Promise<void>>();
const mockDeleteApiKey = jest.fn<() => Promise<boolean>>();
const mockHasApiKey = jest.fn<() => Promise<boolean>>();

jest.unstable_mockModule('../../src/auth/keychain.js', () => ({
  KeychainService: jest.fn().mockImplementation(() => ({
    getApiKey: mockGetApiKey,
    setApiKey: mockSetApiKey,
    deleteApiKey: mockDeleteApiKey,
    hasApiKey: mockHasApiKey
  }))
}));

// Import after mocks are set up
const { LocalAuthProvider } = await import('../../src/auth/local-auth-provider.js');
const { KeychainService } = await import('../../src/auth/keychain.js');
const { NotAuthenticatedError } = await import('../../src/utils/errors.js');

describe('LocalAuthProvider', () => {
  let authProvider: InstanceType<typeof LocalAuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockKeychain = new KeychainService();
    authProvider = new LocalAuthProvider(mockKeychain);
  });

  describe('getApiKey', () => {
    it('returns API key when authenticated', async () => {
      mockGetApiKey.mockResolvedValue('stored-key');

      const result = await authProvider.getApiKey();

      expect(result).toBe('stored-key');
    });

    it('throws NotAuthenticatedError when no key', async () => {
      mockGetApiKey.mockResolvedValue(null);

      await expect(authProvider.getApiKey()).rejects.toThrow(NotAuthenticatedError);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when key exists', async () => {
      mockHasApiKey.mockResolvedValue(true);

      const result = await authProvider.isAuthenticated();

      expect(result).toBe(true);
    });

    it('returns false when no key', async () => {
      mockHasApiKey.mockResolvedValue(false);

      const result = await authProvider.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('removes API key from keychain', async () => {
      mockDeleteApiKey.mockResolvedValue(true);

      await authProvider.logout();

      expect(mockDeleteApiKey).toHaveBeenCalled();
    });
  });
});
