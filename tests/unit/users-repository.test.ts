// tests/unit/users-repository.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('UserRepository', () => {
  let mockClient: any;
  let userRepository: any;

  beforeEach(async () => {
    jest.resetModules();

    mockClient = {
      query: jest.fn()
    };

    const { UserRepository } = await import('../../src/db/users.js');
    userRepository = new UserRepository(mockClient);
  });

  describe('findByTouchstoneUser', () => {
    it('returns user when found', async () => {
      const mockUser = {
        id: '123',
        touchstone_user: 'test@example.com',
        created_at: new Date(),
        last_login_at: null
      };
      mockClient.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userRepository.findByTouchstoneUser('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com']
      );
    });

    it('returns null when not found', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.findByTouchstoneUser('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns new user', async () => {
      const mockUser = {
        id: '123',
        touchstone_user: 'new@example.com',
        created_at: new Date(),
        last_login_at: null
      };
      mockClient.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userRepository.create('new@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        ['new@example.com']
      );
    });
  });

  describe('findOrCreate', () => {
    it('returns existing user if found', async () => {
      const mockUser = {
        id: '123',
        touchstone_user: 'existing@example.com',
        created_at: new Date(),
        last_login_at: null
      };
      mockClient.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await userRepository.findOrCreate('existing@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    it('creates new user if not found', async () => {
      const mockUser = {
        id: '456',
        touchstone_user: 'new@example.com',
        created_at: new Date(),
        last_login_at: null
      };
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // findByTouchstoneUser returns null
        .mockResolvedValueOnce({ rows: [mockUser] }); // create returns new user

      const result = await userRepository.findOrCreate('new@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateLastLogin', () => {
    it('updates last_login_at timestamp', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await userRepository.updateLastLogin('123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['123'])
      );
    });
  });
});
