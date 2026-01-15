import { jest } from '@jest/globals';

// Create mocks BEFORE importing modules that use them
const mockGetApiKey = jest.fn<() => Promise<string | null>>();
const mockSetApiKey = jest.fn<() => Promise<void>>();
const mockDeleteApiKey = jest.fn<() => Promise<boolean>>();
const mockHasApiKey = jest.fn<() => Promise<boolean>>();
const mockAuthenticate = jest.fn<() => Promise<string>>();

jest.unstable_mockModule('../../src/auth/keychain.js', () => ({
  KeychainService: jest.fn().mockImplementation(() => ({
    getApiKey: mockGetApiKey,
    setApiKey: mockSetApiKey,
    deleteApiKey: mockDeleteApiKey,
    hasApiKey: mockHasApiKey
  }))
}));

jest.unstable_mockModule('../../src/touchstone/client.js', () => ({
  TouchstoneClient: jest.fn().mockImplementation(() => ({
    authenticate: mockAuthenticate
  }))
}));

// Import after mocks are set up
const { AuthManager } = await import('../../src/auth/auth-manager.js');
const { KeychainService } = await import('../../src/auth/keychain.js');
const { TouchstoneClient } = await import('../../src/touchstone/client.js');
const { NotAuthenticatedError } = await import('../../src/utils/errors.js');

describe('AuthManager', () => {
  let authManager: InstanceType<typeof AuthManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockKeychain = new KeychainService();
    const mockClient = new TouchstoneClient('https://example.com');
    authManager = new AuthManager(mockKeychain, mockClient);
  });

  describe('authenticate', () => {
    it('authenticates and stores API key', async () => {
      mockAuthenticate.mockResolvedValue('new-api-key');
      mockSetApiKey.mockResolvedValue();

      const result = await authManager.authenticate('user', 'pass');

      expect(mockAuthenticate).toHaveBeenCalledWith('user', 'pass');
      expect(mockSetApiKey).toHaveBeenCalledWith('new-api-key');
      expect(result).toEqual({ success: true, message: 'Successfully authenticated with Touchstone.' });
    });
  });

  describe('getApiKey', () => {
    it('returns API key when authenticated', async () => {
      mockGetApiKey.mockResolvedValue('stored-key');

      const result = await authManager.getApiKey();

      expect(result).toBe('stored-key');
    });

    it('throws NotAuthenticatedError when no key', async () => {
      mockGetApiKey.mockResolvedValue(null);

      await expect(authManager.getApiKey()).rejects.toThrow(NotAuthenticatedError);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when key exists', async () => {
      mockHasApiKey.mockResolvedValue(true);

      const result = await authManager.isAuthenticated();

      expect(result).toBe(true);
    });

    it('returns false when no key', async () => {
      mockHasApiKey.mockResolvedValue(false);

      const result = await authManager.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('removes API key from keychain', async () => {
      mockDeleteApiKey.mockResolvedValue(true);

      await authManager.logout();

      expect(mockDeleteApiKey).toHaveBeenCalled();
    });
  });
});
