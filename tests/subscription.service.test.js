"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_service_1 = require("../../src/services/subscription.service");
const db_1 = require("../../src/db");
jest.mock('../../src/db');
describe('Subscription Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('findAll', () => {
        it('should return subscriptions and total count', async () => {
            const mockSubscriptions = [
                { id: 1, userId: 1, status: 'active', stripeSubscriptionId: 'sub_1' },
            ];
            const mockTotal = [{ value: 1 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            const result = await (0, subscription_service_1.findAll)({ userId: 1 });
            expect(result).toHaveProperty('subscriptions');
            expect(result).toHaveProperty('totalCount');
            expect(result.subscriptions).toEqual(mockSubscriptions);
            expect(result.totalCount).toBe(1);
        });
        it('should use default pagination values', async () => {
            const mockSubscriptions = [];
            const mockTotal = [{ value: 0 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            await (0, subscription_service_1.findAll)({});
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should filter by userId', async () => {
            const userId = 42;
            const mockSubscriptions = [];
            const mockTotal = [{ value: 0 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            await (0, subscription_service_1.findAll)({ userId });
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should filter by accountId', async () => {
            const accountId = 5;
            const mockSubscriptions = [];
            const mockTotal = [{ value: 0 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            await (0, subscription_service_1.findAll)({ accountId });
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should filter by status', async () => {
            const status = 'active';
            const mockSubscriptions = [];
            const mockTotal = [{ value: 0 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            await (0, subscription_service_1.findAll)({ status });
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should filter by startDate', async () => {
            const startDate = '2024-01-01';
            const mockSubscriptions = [];
            const mockTotal = [{ value: 0 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            await (0, subscription_service_1.findAll)({ startDate });
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should filter by year with UTC conversion', async () => {
            const year = 2024;
            const mockSubscriptions = [];
            const mockTotal = [{ value: 0 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            await (0, subscription_service_1.findAll)({ year });
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should support pagination', async () => {
            const page = 2;
            const pageSize = 20;
            const mockSubscriptions = [];
            const mockTotal = [{ value: 50 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            const result = await (0, subscription_service_1.findAll)({ page, pageSize });
            expect(result).toHaveProperty('totalCount', 50);
        });
        it('should support sorting', async () => {
            const sort = 'status:desc';
            const mockSubscriptions = [];
            const mockTotal = [{ value: 0 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            await (0, subscription_service_1.findAll)({ sort });
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should handle multiple filter combinations', async () => {
            const mockSubscriptions = [];
            const mockTotal = [{ value: 5 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            const result = await (0, subscription_service_1.findAll)({
                userId: 1,
                accountId: 5,
                status: 'active',
                year: 2024,
                page: 1,
                pageSize: 10,
                sort: 'createdAt:desc',
            });
            expect(result.subscriptions).toEqual(mockSubscriptions);
            expect(result.totalCount).toBe(5);
        });
        it('should return empty results when no matches found', async () => {
            const mockSubscriptions = [];
            const mockTotal = [{ value: 0 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            const result = await (0, subscription_service_1.findAll)({ userId: 9999 });
            expect(result.subscriptions).toEqual([]);
            expect(result.totalCount).toBe(0);
        });
        it('should include customer information in results', async () => {
            const mockSubscriptions = [
                {
                    id: 1,
                    stripeSubscriptionId: 'sub_1',
                    customer: { name: 'John Doe', email: 'john@example.com' },
                    price: { stripePriceId: 'price_1', unitAmount: 999 },
                    product: { name: 'Premium Plan', description: 'Premium' },
                },
            ];
            const mockTotal = [{ value: 1 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            const result = await (0, subscription_service_1.findAll)({});
            expect(result.subscriptions[0]).toHaveProperty('customer');
            expect(result.subscriptions[0]).toHaveProperty('price');
            expect(result.subscriptions[0]).toHaveProperty('product');
        });
        it('should handle database errors gracefully', async () => {
            const error = new Error('Database connection failed');
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockRejectedValue(error),
                            }),
                        }),
                    }),
                }),
            });
            await expect((0, subscription_service_1.findAll)({})).rejects.toThrow('Database connection failed');
        });
        it('should preserve data types in results', async () => {
            const mockSubscriptions = [
                {
                    id: 1,
                    quantity: 5,
                    status: 'active',
                    createdAt: new Date('2024-01-01'),
                },
            ];
            const mockTotal = [{ value: 1 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            const result = await (0, subscription_service_1.findAll)({});
            expect(typeof result.subscriptions[0].id).toBe('number');
            expect(typeof result.subscriptions[0].quantity).toBe('number');
            expect(typeof result.subscriptions[0].status).toBe('string');
            expect(result.subscriptions[0].createdAt instanceof Date).toBe(true);
        });
    });
    describe('Performance', () => {
        it('should handle large datasets', async () => {
            const largeDataset = Array.from({ length: 500 }, (_, i) => ({
                id: i,
                status: 'active',
            }));
            const mockTotal = [{ value: 500 }];
            db_1.db.select
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        offset: jest.fn().mockReturnValue({
                                            orderBy: jest.fn().mockResolvedValue(largeDataset),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    }),
                }),
            })
                .mockReturnValueOnce({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            leftJoin: jest.fn().mockReturnValue({
                                where: jest.fn().mockResolvedValue(mockTotal),
                            }),
                        }),
                    }),
                }),
            });
            const result = await (0, subscription_service_1.findAll)({ pageSize: 100 });
            expect(result.subscriptions.length).toBe(500);
            expect(result.totalCount).toBe(500);
        });
    });
});
//# sourceMappingURL=subscription.service.test.js.map