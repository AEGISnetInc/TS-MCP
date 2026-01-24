import { jest } from '@jest/globals';

// Create mocks BEFORE importing modules that use them
const mockGetApiKey = jest.fn<() => Promise<string | null>>();
const mockSetApiKey = jest.fn<() => Promise<void>>();
const mockDeleteApiKey = jest.fn<() => Promise<boolean>>();
const mockHasApiKey = jest.fn<() => Promise<boolean>>();
const mockGetCredentials = jest.fn<() => Promise<{ username: string; password: string } | null>>();
const mockSetCredentials = jest.fn<() => Promise<void>>();
const mockHasCredentials = jest.fn<() => Promise<boolean>>();

const mockAuthenticate = jest.fn<() => Promise<string>>();
const mockGetConfig = jest.fn();

jest.unstable_mockModule('../../src/auth/keychain.js', () => ({
  KeychainService: jest.fn().mockImplementation(() => ({
    getApiKey: mockGetApiKey,
    setApiKey: mockSetApiKey,
    deleteApiKey: mockDeleteApiKey,
    hasApiKey: mockHasApiKey,
    getCredentials: mockGetCredentials,
    setCredentials: mockSetCredentials,
    hasCredentials: mockHasCredentials
  }))
}));

jest.unstable_mockModule('../../src/touchstone/client.js', () => ({
  TouchstoneClient: jest.fn().mockImplementation(() => ({
    authenticate: mockAuthenticate
  }))
}));

jest.unstable_mockModule('../../src/utils/config.js', () => ({
  getConfig: mockGetConfig
}));

// Import after mocks are set up
const { LocalAuthProvider } = await import('../../src/auth/local-auth-provider.js');
const { KeychainService } = await import('../../src/auth/keychain.js');
const { NotAuthenticatedError } = await import('../../src/utils/errors.js');

describe('LocalAuthProvider', () => {
  let authProvider: InstanceType<typeof LocalAuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConfig.mockReturnValue({ touchstoneBaseUrl: 'https://touchstone.example.com' });
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

  describe('refreshApiKey', () => {
    it('refreshes API key using stored credentials', async () => {
      mockGetCredentials.mockResolvedValue({ username: 'user@example.com', password: 'secret' });
      mockAuthenticate.mockResolvedValue('new-api-key');

      const result = await authProvider.refreshApiKey();

      expect(result).toBe('new-api-key');
      expect(mockAuthenticate).toHaveBeenCalledWith('user@example.com', 'secret');
      expect(mockSetApiKey).toHaveBeenCalledWith('new-api-key');
    });

    it('returns null when no credentials stored', async () => {
      mockGetCredentials.mockResolvedValue(null);

      const result = await authProvider.refreshApiKey();

      expect(result).toBeNull();
      expect(mockAuthenticate).not.toHaveBeenCalled();
    });

    it('throws when authentication fails', async () => {
      mockGetCredentials.mockResolvedValue({ username: 'user@example.com', password: 'wrong' });
      mockAuthenticate.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authProvider.refreshApiKey()).rejects.toThrow('Invalid credentials');
    });
  });

  describe('canAutoRefresh', () => {
    it('returns true when credentials exist', async () => {
      mockHasCredentials.mockResolvedValue(true);

      const result = await authProvider.canAutoRefresh();

      expect(result).toBe(true);
    });

    it('returns false when no credentials', async () => {
      mockHasCredentials.mockResolvedValue(false);

      const result = await authProvider.canAutoRefresh();

      expect(result).toBe(false);
    });
  });
});
