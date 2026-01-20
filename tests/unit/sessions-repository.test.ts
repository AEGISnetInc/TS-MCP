// tests/unit/sessions-repository.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('SessionRepository', () => {
  let mockClient: any;
  let sessionRepository: any;

  beforeEach(async () => {
    jest.resetModules();

    mockClient = {
      query: jest.fn()
    };

    const { SessionRepository } = await import('../../src/db/sessions.js');
    sessionRepository = new SessionRepository(mockClient);
  });

  describe('create', () => {
    it('creates session with encrypted API key', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        session_token: 'token-abc',
        api_key_enc: 'encrypted-key',
        created_at: new Date(),
        expires_at: new Date(),
        last_used_at: new Date()
      };
      mockClient.query.mockResolvedValue({ rows: [mockSession] });

      const result = await sessionRepository.create({
        userId: 'user-456',
        sessionToken: 'token-abc',
        apiKeyEncrypted: 'encrypted-key',
        ttlDays: 30
      });

      expect(result).toEqual(mockSession);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions'),
        expect.arrayContaining(['user-456', 'token-abc', 'encrypted-key'])
      );
    });
  });

  describe('findByToken', () => {
    it('returns session when found and not expired', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        session_token: 'token-abc',
        api_key_enc: 'encrypted-key',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 86400000), // tomorrow
        last_used_at: new Date()
      };
      mockClient.query.mockResolvedValue({ rows: [mockSession] });

      const result = await sessionRepository.findByToken('token-abc');

      expect(result).toEqual(mockSession);
    });

    it('returns null when not found', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await sessionRepository.findByToken('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes session by token', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await sessionRepository.deleteByToken('token-abc');

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['token-abc']
      );
    });

    it('returns false when session not found', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 0 });

      const result = await sessionRepository.deleteByToken('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('updateLastUsed', () => {
    it('updates last_used_at timestamp', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await sessionRepository.updateLastUsed('token-abc');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        ['token-abc']
      );
    });
  });

  describe('deleteExpired', () => {
    it('deletes all expired sessions', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 5 });

      const result = await sessionRepository.deleteExpired();

      expect(result).toBe(5);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        []
      );
    });
  });
});
