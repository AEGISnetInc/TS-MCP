// tests/unit/auth-service.test.ts
import { jest } from '@jest/globals';

// Create mocks BEFORE importing modules that use them
const mockEncrypt = jest.fn<(plaintext: string) => string>();
const mockRandomBytes = jest.fn<(size: number) => Buffer>();

jest.unstable_mockModule('../../src/crypto/encryption.js', () => ({
  encrypt: mockEncrypt
}));

jest.unstable_mockModule('crypto', () => ({
  randomBytes: mockRandomBytes
}));

// Import after mocks are set up
const { AuthService } = await import('../../src/server/auth-service.js');

describe('AuthService', () => {
  let mockUserRepo: {
    findOrCreate: jest.Mock<(touchstoneUser: string) => Promise<{ id: string; touchstone_user: string }>>;
    updateLastLogin: jest.Mock<(userId: string) => Promise<void>>;
  };
  let mockSessionRepo: {
    create: jest.Mock<(params: any) => Promise<{ id: string; session_token: string; expires_at: Date }>>;
    findByToken: jest.Mock<(token: string) => Promise<{ id: string; user_id: string; expires_at: Date } | null>>;
    deleteByToken: jest.Mock<(token: string) => Promise<boolean>>;
  };
  let mockTouchstoneClient: {
    authenticate: jest.Mock<(username: string, password: string) => Promise<string>>;
  };
  let authService: InstanceType<typeof AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepo = {
      findOrCreate: jest.fn(),
      updateLastLogin: jest.fn()
    };

    mockSessionRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      deleteByToken: jest.fn()
    };

    mockTouchstoneClient = {
      authenticate: jest.fn()
    };

    // Mock randomBytes to return a predictable value
    mockRandomBytes.mockReturnValue(Buffer.from('0'.repeat(64), 'hex'));

    authService = new AuthService(
      mockUserRepo as any,
      mockSessionRepo as any,
      mockTouchstoneClient as any,
      30
    );
  });

  describe('login', () => {
    it('authenticates with Touchstone and creates session', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      mockTouchstoneClient.authenticate.mockResolvedValue('touchstone-api-key');
      mockUserRepo.findOrCreate.mockResolvedValue({ id: 'user-123', touchstone_user: 'test@example.com' });
      mockEncrypt.mockReturnValue('encrypted-api-key');
      mockSessionRepo.create.mockResolvedValue({
        id: 'session-456',
        session_token: '30303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030',
        expires_at: expiresAt
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(mockTouchstoneClient.authenticate).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockUserRepo.findOrCreate).toHaveBeenCalledWith('test@example.com');
      expect(mockEncrypt).toHaveBeenCalledWith('touchstone-api-key');
      expect(mockSessionRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        sessionToken: expect.any(String),
        apiKeyEncrypted: 'encrypted-api-key',
        ttlDays: 30
      });
      expect(mockUserRepo.updateLastLogin).toHaveBeenCalledWith('user-123');
      expect(result).toHaveProperty('sessionToken');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('userId', 'user-123');
      expect(result).toHaveProperty('touchstoneUser', 'test@example.com');
    });

    it('throws when Touchstone authentication fails', async () => {
      mockTouchstoneClient.authenticate.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('deletes session by token', async () => {
      mockSessionRepo.deleteByToken.mockResolvedValue(true);

      const result = await authService.logout('session-token');

      expect(result).toBe(true);
      expect(mockSessionRepo.deleteByToken).toHaveBeenCalledWith('session-token');
    });

    it('returns false when session not found', async () => {
      mockSessionRepo.deleteByToken.mockResolvedValue(false);

      const result = await authService.logout('nonexistent-token');

      expect(result).toBe(false);
    });
  });

  describe('getSessionStatus', () => {
    it('returns session info when valid', async () => {
      const expiresAt = new Date(Date.now() + 86400000);
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        expires_at: expiresAt
      };
      mockSessionRepo.findByToken.mockResolvedValue(mockSession);

      const result = await authService.getSessionStatus('valid-token');

      expect(result).toEqual({
        valid: true,
        expiresAt: expiresAt,
        userId: 'user-456'
      });
    });

    it('returns invalid when session not found', async () => {
      mockSessionRepo.findByToken.mockResolvedValue(null);

      const result = await authService.getSessionStatus('invalid-token');

      expect(result).toEqual({ valid: false });
    });
  });
});
