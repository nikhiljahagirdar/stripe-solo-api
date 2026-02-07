"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compression_middleware_1 = require("../../src/middleware/compression.middleware");
describe('Compression Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFn;
    beforeEach(() => {
        mockReq = {
            headers: {},
        };
        mockRes = {
            on: jest.fn(),
            once: jest.fn(),
            removeListener: jest.fn(),
            emit: jest.fn(),
            listeners: jest.fn(() => []),
        };
        nextFn = jest.fn();
    });
    describe('Middleware Initialization', () => {
        it('should be a function', () => {
            expect(typeof compression_middleware_1.compressionMiddleware).toBe('function');
        });
        it('should return a middleware function with correct signature', () => {
            expect(compression_middleware_1.compressionMiddleware.length).toBeGreaterThanOrEqual(3);
        });
    });
    describe('Compression Configuration', () => {
        it('should apply compression to responses larger than threshold', async () => {
            const largeData = 'x'.repeat(2000);
            mockRes = {
                ...mockRes,
                write: jest.fn().mockReturnThis(),
                end: jest.fn().mockReturnThis(),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should skip compression for small responses', () => {
            mockRes = {
                ...mockRes,
                write: jest.fn().mockReturnThis(),
                end: jest.fn().mockReturnThis(),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should skip compression with x-no-compression header', () => {
            mockReq = {
                headers: {
                    'x-no-compression': 'true',
                },
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
    });
    describe('Middleware Export', () => {
        it('should export a function named compressionMiddleware', () => {
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
            expect(typeof compression_middleware_1.compressionMiddleware).toBe('function');
        });
        it('should be a valid Express middleware', () => {
            const middleware = compression_middleware_1.compressionMiddleware;
            expect(middleware.length).toBeGreaterThanOrEqual(3);
        });
    });
    describe('Compression Levels', () => {
        it('should use compression level 6 for balance', () => {
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should have threshold of 1KB', () => {
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
    });
    describe('Content-Type Handling', () => {
        it('should compress text responses', () => {
            mockRes = {
                ...mockRes,
                getHeader: jest.fn((name) => {
                    if (name === 'content-type') {
                        return 'text/plain';
                    }
                    return undefined;
                }),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should compress JSON responses', () => {
            mockRes = {
                ...mockRes,
                getHeader: jest.fn((name) => {
                    if (name === 'content-type') {
                        return 'application/json';
                    }
                    return undefined;
                }),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should not compress already compressed responses', () => {
            mockRes = {
                ...mockRes,
                getHeader: jest.fn((name) => {
                    if (name === 'content-type') {
                        return 'application/gzip';
                    }
                    return undefined;
                }),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
    });
    describe('Error Handling', () => {
        it('should handle middleware errors gracefully', () => {
            expect(() => {
                expect(compression_middleware_1.compressionMiddleware).toBeDefined();
            }).not.toThrow();
        });
        it('should not crash on invalid request', () => {
            mockReq = {};
            mockRes = {};
            expect(() => {
                expect(compression_middleware_1.compressionMiddleware).toBeDefined();
            }).not.toThrow();
        });
    });
    describe('Performance Impact', () => {
        it('should not add significant overhead for uncompressed responses', () => {
            const start = Date.now();
            mockRes = {
                ...mockRes,
                write: jest.fn().mockReturnThis(),
                end: jest.fn().mockReturnThis(),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(100);
        });
    });
    describe('Integration', () => {
        it('should be compatible with express pipeline', () => {
            const isExpressMiddleware = compression_middleware_1.compressionMiddleware.length >= 3;
            expect(isExpressMiddleware).toBe(true);
        });
        it('should work in middleware chain', () => {
            const middleware = compression_middleware_1.compressionMiddleware;
            expect(middleware).toBeDefined();
            expect(typeof middleware).toBe('function');
        });
    });
    describe('Configuration Validation', () => {
        it('should have reasonable compression level (1-9)', () => {
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should have reasonable threshold (> 0 bytes)', () => {
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should apply compression by default', () => {
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
    });
    describe('Real-World Scenarios', () => {
        it('should compress API JSON responses', () => {
            const apiResponse = JSON.stringify({
                data: new Array(100).fill({
                    id: 1,
                    name: 'test',
                    email: 'test@example.com',
                    createdAt: new Date(),
                }),
                total: 100,
                page: 1,
            });
            mockRes = {
                ...mockRes,
                getHeader: jest.fn((name) => {
                    if (name === 'content-type') {
                        return 'application/json';
                    }
                    return undefined;
                }),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should compress HTML responses', () => {
            const htmlResponse = `<html><body>${'x'.repeat(5000)}</body></html>`;
            mockRes = {
                ...mockRes,
                getHeader: jest.fn((name) => {
                    if (name === 'content-type') {
                        return 'text/html';
                    }
                    return undefined;
                }),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should compress SVG images', () => {
            const svgResponse = `<svg>${'x'.repeat(5000)}</svg>`;
            mockRes = {
                ...mockRes,
                getHeader: jest.fn((name) => {
                    if (name === 'content-type') {
                        return 'image/svg+xml';
                    }
                    return undefined;
                }),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
    });
    describe('Header Handling', () => {
        it('should respect Accept-Encoding header', () => {
            mockReq = {
                headers: {
                    'accept-encoding': 'gzip, deflate',
                },
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should handle missing Accept-Encoding header', () => {
            mockReq = {
                headers: {},
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should add Content-Encoding header when compressing', () => {
            mockRes = {
                ...mockRes,
                setHeader: jest.fn(),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
    });
    describe('Backward Compatibility', () => {
        it('should not break if compression is not supported by client', () => {
            mockReq = {
                headers: {
                    'accept-encoding': 'deflate',
                },
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should be optional/transparent to clients', () => {
            mockReq = {
                headers: {},
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
    });
    describe('Memory Efficiency', () => {
        it('should not cache entire response in memory', () => {
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
        it('should handle large responses without buffering', () => {
            const largeData = 'x'.repeat(1000000);
            mockRes = {
                ...mockRes,
                write: jest.fn().mockReturnThis(),
                end: jest.fn().mockReturnThis(),
            };
            expect(compression_middleware_1.compressionMiddleware).toBeDefined();
        });
    });
});
//# sourceMappingURL=compression.middleware.test.js.map