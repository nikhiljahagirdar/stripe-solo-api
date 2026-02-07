"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_utils_1 = require("../src/utils/cache.utils");
describe('Cache Utilities', () => {
    beforeEach(() => {
        cache_utils_1.cacheManager.clear();
    });
    afterAll(() => {
        cache_utils_1.cacheManager.stopCleanup();
    });
    describe('generateCacheKey', () => {
        it('should generate a string key from parts', () => {
            const key = (0, cache_utils_1.generateCacheKey)('users', '123', 'active');
            expect(typeof key).toBe('string');
            expect(key).toContain(':');
        });
        it('should join parts with colon separator', () => {
            const key = (0, cache_utils_1.generateCacheKey)('users', '123');
            expect(key).toBe('users:123');
        });
        it('should handle multiple parts', () => {
            const key = (0, cache_utils_1.generateCacheKey)('users', '123', 'profile', 'avatar');
            expect(key).toBe('users:123:profile:avatar');
        });
        it('should handle single part', () => {
            const key = (0, cache_utils_1.generateCacheKey)('all-users');
            expect(key).toBe('all-users');
        });
        it('should produce different keys for different inputs', () => {
            const key1 = (0, cache_utils_1.generateCacheKey)('users', '123');
            const key2 = (0, cache_utils_1.generateCacheKey)('users', '456');
            const key3 = (0, cache_utils_1.generateCacheKey)('posts', '123');
            expect(key1).not.toBe(key2);
            expect(key1).not.toBe(key3);
            expect(key2).not.toBe(key3);
        });
    });
    describe('CacheManager.set and get', () => {
        it('should store and retrieve a value', () => {
            const key = 'test-key';
            const value = { id: 1, name: 'Test' };
            cache_utils_1.cacheManager.set(key, value);
            const retrieved = cache_utils_1.cacheManager.get(key);
            expect(retrieved).toEqual(value);
        });
        it('should return null for non-existent key', () => {
            const value = cache_utils_1.cacheManager.get('non-existent');
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
                cache_utils_1.cacheManager.set(key, value);
                expect(cache_utils_1.cacheManager.get(key)).toEqual(value);
            });
        });
        it('should accept custom TTL', () => {
            const key = 'ttl-test';
            const value = { test: 'data' };
            const ttl = 1000;
            cache_utils_1.cacheManager.set(key, value, ttl);
            const retrieved = cache_utils_1.cacheManager.get(key);
            expect(retrieved).toEqual(value);
        });
        it('should use default TTL of 5 minutes', () => {
            const key = 'default-ttl';
            const value = { data: 'test' };
            cache_utils_1.cacheManager.set(key, value);
            const retrieved = cache_utils_1.cacheManager.get(key);
            expect(retrieved).toEqual(value);
        });
        it('should return correct value from multiple stored items', () => {
            const values = [
                { key: 'key1', value: 'value1' },
                { key: 'key2', value: 'value2' },
                { key: 'key3', value: 'value3' },
            ];
            values.forEach(({ key, value }) => {
                cache_utils_1.cacheManager.set(key, value);
            });
            values.forEach(({ key, value }) => {
                expect(cache_utils_1.cacheManager.get(key)).toBe(value);
            });
        });
    });
    describe('CacheManager.delete', () => {
        it('should remove a cached value', () => {
            const key = 'delete-test';
            const value = { test: 'data' };
            cache_utils_1.cacheManager.set(key, value);
            expect(cache_utils_1.cacheManager.get(key)).toEqual(value);
            cache_utils_1.cacheManager.delete(key);
            expect(cache_utils_1.cacheManager.get(key)).toBeNull();
        });
        it('should not affect other cached values', () => {
            const key1 = 'key1';
            const key2 = 'key2';
            const value1 = { id: 1 };
            const value2 = { id: 2 };
            cache_utils_1.cacheManager.set(key1, value1);
            cache_utils_1.cacheManager.set(key2, value2);
            cache_utils_1.cacheManager.delete(key1);
            expect(cache_utils_1.cacheManager.get(key1)).toBeNull();
            expect(cache_utils_1.cacheManager.get(key2)).toEqual(value2);
        });
        it('should handle deleting non-existent key gracefully', () => {
            expect(() => {
                cache_utils_1.cacheManager.delete('non-existent');
            }).not.toThrow();
        });
    });
    describe('CacheManager.clear', () => {
        it('should remove all cached values', () => {
            cache_utils_1.cacheManager.set('key1', 'value1');
            cache_utils_1.cacheManager.set('key2', 'value2');
            cache_utils_1.cacheManager.set('key3', 'value3');
            expect(cache_utils_1.cacheManager.size()).toBe(3);
            cache_utils_1.cacheManager.clear();
            expect(cache_utils_1.cacheManager.size()).toBe(0);
            expect(cache_utils_1.cacheManager.get('key1')).toBeNull();
            expect(cache_utils_1.cacheManager.get('key2')).toBeNull();
            expect(cache_utils_1.cacheManager.get('key3')).toBeNull();
        });
        it('should allow storing new values after clear', () => {
            cache_utils_1.cacheManager.set('old-key', 'old-value');
            cache_utils_1.cacheManager.clear();
            const newKey = 'new-key';
            const newValue = 'new-value';
            cache_utils_1.cacheManager.set(newKey, newValue);
            expect(cache_utils_1.cacheManager.get(newKey)).toBe(newValue);
            expect(cache_utils_1.cacheManager.size()).toBe(1);
        });
    });
    describe('CacheManager.size', () => {
        it('should return 0 for empty cache', () => {
            cache_utils_1.cacheManager.clear();
            expect(cache_utils_1.cacheManager.size()).toBe(0);
        });
        it('should increment with each added item', () => {
            cache_utils_1.cacheManager.clear();
            expect(cache_utils_1.cacheManager.size()).toBe(0);
            cache_utils_1.cacheManager.set('key1', 'value1');
            expect(cache_utils_1.cacheManager.size()).toBe(1);
            cache_utils_1.cacheManager.set('key2', 'value2');
            expect(cache_utils_1.cacheManager.size()).toBe(2);
            cache_utils_1.cacheManager.set('key3', 'value3');
            expect(cache_utils_1.cacheManager.size()).toBe(3);
        });
        it('should decrement when items are deleted', () => {
            cache_utils_1.cacheManager.clear();
            cache_utils_1.cacheManager.set('key1', 'value1');
            cache_utils_1.cacheManager.set('key2', 'value2');
            expect(cache_utils_1.cacheManager.size()).toBe(2);
            cache_utils_1.cacheManager.delete('key1');
            expect(cache_utils_1.cacheManager.size()).toBe(1);
        });
        it('should be 0 after clear', () => {
            cache_utils_1.cacheManager.set('key1', 'value1');
            cache_utils_1.cacheManager.set('key2', 'value2');
            cache_utils_1.cacheManager.clear();
            expect(cache_utils_1.cacheManager.size()).toBe(0);
        });
    });
    describe('Cache Expiration (TTL)', () => {
        it('should return null for expired cache entry', async () => {
            const key = 'expiring-key';
            const value = { data: 'test' };
            const ttl = 100;
            cache_utils_1.cacheManager.set(key, value, ttl);
            expect(cache_utils_1.cacheManager.get(key)).toEqual(value);
            await new Promise(resolve => setTimeout(resolve, 150));
            expect(cache_utils_1.cacheManager.get(key)).toBeNull();
        });
        it('should not expire before TTL', async () => {
            const key = 'not-expiring-key';
            const value = { data: 'test' };
            const ttl = 1000;
            cache_utils_1.cacheManager.set(key, value, ttl);
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(cache_utils_1.cacheManager.get(key)).toEqual(value);
        });
        it('should handle very short TTL', async () => {
            const key = 'short-ttl';
            const value = 'test';
            const ttl = 50;
            cache_utils_1.cacheManager.set(key, value, ttl);
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(cache_utils_1.cacheManager.get(key)).toBeNull();
        });
        it('should handle very long TTL', async () => {
            const key = 'long-ttl';
            const value = 'test';
            const ttl = 24 * 60 * 60 * 1000;
            cache_utils_1.cacheManager.set(key, value, ttl);
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(cache_utils_1.cacheManager.get(key)).toEqual(value);
        });
    });
    describe('Type Safety', () => {
        it('should preserve object shape', () => {
            const user = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
            };
            cache_utils_1.cacheManager.set('user', user);
            const retrieved = cache_utils_1.cacheManager.get('user');
            expect(retrieved).toEqual(user);
            expect(retrieved?.id).toBe(1);
            expect(retrieved?.name).toBe('Test User');
            expect(retrieved?.email).toBe('test@example.com');
        });
        it('should handle array preservation', () => {
            const items = [1, 2, 3, 4, 5];
            cache_utils_1.cacheManager.set('numbers', items);
            const retrieved = cache_utils_1.cacheManager.get('numbers');
            expect(Array.isArray(retrieved)).toBe(true);
            expect(retrieved).toEqual(items);
            expect(retrieved?.length).toBe(5);
        });
    });
    describe('Concurrency', () => {
        it('should handle multiple rapid sets', () => {
            const items = 100;
            for (let i = 0; i < items; i++) {
                cache_utils_1.cacheManager.set(`key${i}`, `value${i}`);
            }
            expect(cache_utils_1.cacheManager.size()).toBe(items);
            for (let i = 0; i < items; i++) {
                expect(cache_utils_1.cacheManager.get(`key${i}`)).toBe(`value${i}`);
            }
        });
        it('should handle mixed operations', () => {
            cache_utils_1.cacheManager.set('key1', 'value1');
            cache_utils_1.cacheManager.set('key2', 'value2');
            cache_utils_1.cacheManager.delete('key1');
            cache_utils_1.cacheManager.set('key3', 'value3');
            cache_utils_1.cacheManager.get('key2');
            cache_utils_1.cacheManager.delete('key2');
            expect(cache_utils_1.cacheManager.size()).toBe(1);
            expect(cache_utils_1.cacheManager.get('key3')).toBe('value3');
        });
    });
    describe('Edge Cases', () => {
        it('should handle empty string key', () => {
            const key = '';
            const value = 'test';
            cache_utils_1.cacheManager.set(key, value);
            expect(cache_utils_1.cacheManager.get(key)).toBe(value);
        });
        it('should handle undefined values', () => {
            cache_utils_1.cacheManager.set('undefined-key', undefined);
            const result = cache_utils_1.cacheManager.get('undefined-key');
            expect(result === undefined || result === null).toBe(true);
        });
        it('should handle large objects', () => {
            const largeObject = {
                data: new Array(1000).fill({ id: 1, name: 'test' }),
            };
            cache_utils_1.cacheManager.set('large', largeObject);
            expect(cache_utils_1.cacheManager.get('large')).toEqual(largeObject);
        });
        it('should handle circular references gracefully', () => {
            const obj = { name: 'test' };
            obj.self = obj;
            expect(() => {
                cache_utils_1.cacheManager.set('circular', obj);
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=cache.utils.test.js.map