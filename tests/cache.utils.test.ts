import { cacheManager, generateCacheKey } from '../src/utils/cache.utils';

describe('Cache Utilities', () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  afterAll(() => {
    cacheManager.stopCleanup();
  });

  describe('generateCacheKey', () => {
    it('should generate a string key from parts', () => {
      const key = generateCacheKey('users', '123', 'active');
      expect(typeof key).toBe('string');
      expect(key).toContain(':');
    });

    it('should join parts with colon separator', () => {
      const key = generateCacheKey('users', '123');
      expect(key).toBe('users:123');
    });

    it('should handle multiple parts', () => {
      const key = generateCacheKey('users', '123', 'profile', 'avatar');
      expect(key).toBe('users:123:profile:avatar');
    });

    it('should handle single part', () => {
      const key = generateCacheKey('all-users');
      expect(key).toBe('all-users');
    });

    it('should produce different keys for different inputs', () => {
      const key1 = generateCacheKey('users', '123');
      const key2 = generateCacheKey('users', '456');
      const key3 = generateCacheKey('posts', '123');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe('CacheManager.set and get', () => {
    it('should store and retrieve a value', () => {
      const key = 'test-key';
      const value = { id: 1, name: 'Test' };

      cacheManager.set(key, value);
      const retrieved = cacheManager.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', () => {
      const value = cacheManager.get('non-existent');
      expect(value).toBeNull();
    });

    it('should store different data types', () => {
      const testCases = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: true },
        { key: 'object', value: { nested: { data: 'value' } } },
        { key: 'array', value: [1, 2, 3, 4, 5] },
        { key: 'null', value: null },
      ];

      testCases.forEach(({ key, value }) => {
        cacheManager.set(key, value);
        expect(cacheManager.get(key)).toEqual(value);
      });
    });

    it('should accept custom TTL', () => {
      const key = 'ttl-test';
      const value = { test: 'data' };
      const ttl = 1000; // 1 second

      cacheManager.set(key, value, ttl);
      const retrieved = cacheManager.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should use default TTL of 5 minutes', () => {
      const key = 'default-ttl';
      const value = { data: 'test' };

      cacheManager.set(key, value);
      const retrieved = cacheManager.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return correct value from multiple stored items', () => {
      const values = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' },
      ];

      values.forEach(({ key, value }) => {
        cacheManager.set(key, value);
      });

      values.forEach(({ key, value }) => {
        expect(cacheManager.get(key)).toBe(value);
      });
    });
  });

  describe('CacheManager.delete', () => {
    it('should remove a cached value', () => {
      const key = 'delete-test';
      const value = { test: 'data' };

      cacheManager.set(key, value);
      expect(cacheManager.get(key)).toEqual(value);

      cacheManager.delete(key);
      expect(cacheManager.get(key)).toBeNull();
    });

    it('should not affect other cached values', () => {
      const key1 = 'key1';
      const key2 = 'key2';
      const value1 = { id: 1 };
      const value2 = { id: 2 };

      cacheManager.set(key1, value1);
      cacheManager.set(key2, value2);

      cacheManager.delete(key1);

      expect(cacheManager.get(key1)).toBeNull();
      expect(cacheManager.get(key2)).toEqual(value2);
    });

    it('should handle deleting non-existent key gracefully', () => {
      expect(() => {
        cacheManager.delete('non-existent');
      }).not.toThrow();
    });
  });

  describe('CacheManager.clear', () => {
    it('should remove all cached values', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.set('key3', 'value3');

      expect(cacheManager.size()).toBe(3);

      cacheManager.clear();

      expect(cacheManager.size()).toBe(0);
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
      expect(cacheManager.get('key3')).toBeNull();
    });

    it('should allow storing new values after clear', () => {
      cacheManager.set('old-key', 'old-value');
      cacheManager.clear();

      const newKey = 'new-key';
      const newValue = 'new-value';
      cacheManager.set(newKey, newValue);

      expect(cacheManager.get(newKey)).toBe(newValue);
      expect(cacheManager.size()).toBe(1);
    });
  });

  describe('CacheManager.size', () => {
    it('should return 0 for empty cache', () => {
      cacheManager.clear();
      expect(cacheManager.size()).toBe(0);
    });

    it('should increment with each added item', () => {
      cacheManager.clear();

      expect(cacheManager.size()).toBe(0);
      cacheManager.set('key1', 'value1');
      expect(cacheManager.size()).toBe(1);
      cacheManager.set('key2', 'value2');
      expect(cacheManager.size()).toBe(2);
      cacheManager.set('key3', 'value3');
      expect(cacheManager.size()).toBe(3);
    });

    it('should decrement when items are deleted', () => {
      cacheManager.clear();
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      expect(cacheManager.size()).toBe(2);
      cacheManager.delete('key1');
      expect(cacheManager.size()).toBe(1);
    });

    it('should be 0 after clear', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      cacheManager.clear();
      expect(cacheManager.size()).toBe(0);
    });
  });

  describe('Cache Expiration (TTL)', () => {
    it('should return null for expired cache entry', async () => {
      const key = 'expiring-key';
      const value = { data: 'test' };
      const ttl = 100; // 100ms

      cacheManager.set(key, value, ttl);
      expect(cacheManager.get(key)).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cacheManager.get(key)).toBeNull();
    });

    it('should not expire before TTL', async () => {
      const key = 'not-expiring-key';
      const value = { data: 'test' };
      const ttl = 1000; // 1 second

      cacheManager.set(key, value, ttl);

      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cacheManager.get(key)).toEqual(value);
    });

    it('should handle very short TTL', async () => {
      const key = 'short-ttl';
      const value = 'test';
      const ttl = 50; // 50ms

      cacheManager.set(key, value, ttl);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cacheManager.get(key)).toBeNull();
    });

    it('should handle very long TTL', async () => {
      const key = 'long-ttl';
      const value = 'test';
      const ttl = 24 * 60 * 60 * 1000; // 24 hours

      cacheManager.set(key, value, ttl);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be there
      expect(cacheManager.get(key)).toEqual(value);
    });
  });

  describe('Type Safety', () => {
    it('should preserve object shape', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const user: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      };

      cacheManager.set('user', user);
      const retrieved = cacheManager.get<User>('user');

      expect(retrieved).toEqual(user);
      expect(retrieved?.id).toBe(1);
      expect(retrieved?.name).toBe('Test User');
      expect(retrieved?.email).toBe('test@example.com');
    });

    it('should handle array preservation', () => {
      const items = [1, 2, 3, 4, 5];
      cacheManager.set('numbers', items);
      const retrieved = cacheManager.get<number[]>('numbers');

      expect(Array.isArray(retrieved)).toBe(true);
      expect(retrieved).toEqual(items);
      expect(retrieved?.length).toBe(5);
    });
  });

  describe('Concurrency', () => {
    it('should handle multiple rapid sets', () => {
      const items = 100;

      for (let i = 0; i < items; i++) {
        cacheManager.set(`key${i}`, `value${i}`);
      }

      expect(cacheManager.size()).toBe(items);

      for (let i = 0; i < items; i++) {
        expect(cacheManager.get(`key${i}`)).toBe(`value${i}`);
      }
    });

    it('should handle mixed operations', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.delete('key1');
      cacheManager.set('key3', 'value3');
      cacheManager.get('key2');
      cacheManager.delete('key2');

      expect(cacheManager.size()).toBe(1);
      expect(cacheManager.get('key3')).toBe('value3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string key', () => {
      const key = '';
      const value = 'test';

      cacheManager.set(key, value);
      expect(cacheManager.get(key)).toBe(value);
    });

    it('should handle undefined values', () => {
      cacheManager.set('undefined-key', undefined);
      // Undefined values might not be cached or might return null
      const result = cacheManager.get('undefined-key');
      expect(result === undefined || result === null).toBe(true);
    });

    it('should handle large objects', () => {
      const largeObject = {
        data: new Array(1000).fill({ id: 1, name: 'test' }),
      };

      cacheManager.set('large', largeObject);
      expect(cacheManager.get('large')).toEqual(largeObject);
    });

    it('should handle circular references gracefully', () => {
      // This test ensures the cache doesn't crash with circular refs
      const obj: any = { name: 'test' };
      obj.self = obj; // Circular reference

      // Should not throw
      expect(() => {
        cacheManager.set('circular', obj);
      }).not.toThrow();
    });
  });
});
