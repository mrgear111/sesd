import { Pool } from 'pg';
import { UserRepository } from '../../src/repositories/UserRepository';
import { User } from '../../src/models/User';

describe('UserRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let userRepository: UserRepository;

  beforeEach(() => {
    // Create a mock Pool with query method
    mockPool = {
      query: jest.fn(),
    } as any;

    userRepository = new UserRepository(mockPool);
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const mockRow = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        created_at: new Date('2024-01-01'),
      };

      mockPool.query.mockResolvedValue({
        rows: [mockRow],
        command: '',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await userRepository.findById('1');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['1']
      );
      expect(result).toEqual({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        createdAt: mockRow.created_at,
      });
    });

    it('should return null when user not found', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        rowCount: 0,
        fields: [],
      });

      const result = await userRepository.findById('999');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['999']
      );
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      const mockRow = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        created_at: new Date('2024-01-01'),
      };

      mockPool.query.mockResolvedValue({
        rows: [mockRow],
        command: '',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await userRepository.findByEmail('test@example.com');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(result).toEqual({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        createdAt: mockRow.created_at,
      });
    });

    it('should return null when user not found by email', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        rowCount: 0,
        fields: [],
      });

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['nonexistent@example.com']
      );
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user and return the created user object', async () => {
      const mockRow = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashedpassword123',
        created_at: new Date('2024-01-01'),
      };

      mockPool.query.mockResolvedValue({
        rows: [mockRow],
        command: 'INSERT',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await userRepository.create({
        username: 'newuser',
        email: 'new@example.com',
        passwordHash: 'hashedpassword123',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['newuser', 'new@example.com', 'hashedpassword123']
      );
      expect(result).toEqual({
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
        passwordHash: 'hashedpassword123',
        createdAt: mockRow.created_at,
      });
    });
  });

  describe('exists', () => {
    it('should return true when user exists', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ exists: true }],
        command: '',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await userRepository.exists('1');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT EXISTS(SELECT 1 FROM users WHERE id = $1) as exists',
        ['1']
      );
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ exists: false }],
        command: '',
        oid: 0,
        rowCount: 1,
        fields: [],
      });

      const result = await userRepository.exists('999');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT EXISTS(SELECT 1 FROM users WHERE id = $1) as exists',
        ['999']
      );
      expect(result).toBe(false);
    });
  });
});
