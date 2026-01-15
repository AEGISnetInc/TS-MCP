import { jest } from '@jest/globals';

// Mock keytar BEFORE importing any modules that use it
const mockGetPassword = jest.fn<() => Promise<string | null>>();
const mockSetPassword = jest.fn<() => Promise<void>>();
const mockDeletePassword = jest.fn<() => Promise<boolean>>();

jest.unstable_mockModule('keytar', () => ({
  default: {
    getPassword: mockGetPassword,
    setPassword: mockSetPassword,
    deletePassword: mockDeletePassword
  }
}));

// Now import the module under test (after mocks are set up)
const { KeychainService, SERVICE_NAME, ACCOUNT_NAME } = await import('../../src/auth/keychain.js');

describe('KeychainService', () => {
  let service: InstanceType<typeof KeychainService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KeychainService();
  });

  describe('getApiKey', () => {
    it('retrieves API key from keychain', async () => {
      mockGetPassword.mockResolvedValue('test-api-key');

      const result = await service.getApiKey();

      expect(mockGetPassword).toHaveBeenCalledWith(SERVICE_NAME, ACCOUNT_NAME);
      expect(result).toBe('test-api-key');
    });

    it('returns null when no key stored', async () => {
      mockGetPassword.mockResolvedValue(null);

      const result = await service.getApiKey();

      expect(result).toBeNull();
    });
  });

  describe('setApiKey', () => {
    it('stores API key in keychain', async () => {
      mockSetPassword.mockResolvedValue();

      await service.setApiKey('new-api-key');

      expect(mockSetPassword).toHaveBeenCalledWith(SERVICE_NAME, ACCOUNT_NAME, 'new-api-key');
    });
  });

  describe('deleteApiKey', () => {
    it('removes API key from keychain', async () => {
      mockDeletePassword.mockResolvedValue(true);

      const result = await service.deleteApiKey();

      expect(mockDeletePassword).toHaveBeenCalledWith(SERVICE_NAME, ACCOUNT_NAME);
      expect(result).toBe(true);
    });
  });

  describe('hasApiKey', () => {
    it('returns true when key exists', async () => {
      mockGetPassword.mockResolvedValue('some-key');

      const result = await service.hasApiKey();

      expect(result).toBe(true);
    });

    it('returns false when no key', async () => {
      mockGetPassword.mockResolvedValue(null);

      const result = await service.hasApiKey();

      expect(result).toBe(false);
    });
  });
});
