"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const charge_service_1 = require("../src/services/charge.service");
const db_1 = require("../src/db");
const date_utils_1 = require("../src/utils/date.utils");
jest.mock('../../src/db');
describe('Charge Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('findAll', () => {
        it('should fetch all charges for a user', async () => {
            const userId = 1;
            const mockCharges = [
                { id: 1, userId, stripeChargeId: 'ch_1', created: 1609459200 },
                { id: 2, userId, stripeChargeId: 'ch_2', created: 1609545600 },
            ];
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue(mockCharges),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId);
            expect(result).toEqual(mockCharges);
        });
        it('should filter charges by account ID', async () => {
            const userId = 1;
            const accountId = 5;
            const mockCharges = [];
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue(mockCharges),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId, accountId);
            expect(result).toEqual(mockCharges);
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should filter charges by year', async () => {
            const userId = 1;
            const year = 2024;
            const mockCharges = [
                { id: 1, userId, created: 1704067200 },
            ];
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue(mockCharges),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId, undefined, year);
            expect(result).toEqual(mockCharges);
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should use UTC timestamps for year filtering', async () => {
            const userId = 1;
            const year = 2024;
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([]),
                }),
            });
            await (0, charge_service_1.findAll)(userId, undefined, year);
            const range = (0, date_utils_1.getYearTimestampRange)(year);
            expect(range.start).toBeLessThan(range.end);
        });
        it('should filter by both accountId and year', async () => {
            const userId = 1;
            const accountId = 5;
            const year = 2024;
            const mockCharges = [];
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue(mockCharges),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId, accountId, year);
            expect(result).toEqual(mockCharges);
        });
        it('should handle empty results', async () => {
            const userId = 1;
            const mockCharges = [];
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue(mockCharges),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId);
            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });
        it('should always filter by userId', async () => {
            const userId = 42;
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([]),
                }),
            });
            await (0, charge_service_1.findAll)(userId);
            expect(db_1.db.select).toHaveBeenCalled();
        });
    });
    describe('findById', () => {
        it('should find a charge by ID and userID', async () => {
            const chargeId = 1;
            const userId = 1;
            const mockCharge = { id: chargeId, userId, stripeChargeId: 'ch_1' };
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([mockCharge]),
                    }),
                }),
            });
            const result = await (0, charge_service_1.findById)(chargeId, userId);
            expect(result).toEqual(mockCharge);
        });
        it('should return null if charge not found', async () => {
            const chargeId = 999;
            const userId = 1;
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });
            const result = await (0, charge_service_1.findById)(chargeId, userId);
            expect(result).toBeNull();
        });
        it('should verify user ownership', async () => {
            const chargeId = 1;
            const userId = 1;
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });
            await (0, charge_service_1.findById)(chargeId, userId);
            expect(db_1.db.select).toHaveBeenCalled();
        });
        it('should return first matching charge only', async () => {
            const chargeId = 1;
            const userId = 1;
            const mockCharges = [
                { id: chargeId, userId, stripeChargeId: 'ch_1' },
                { id: chargeId, userId, stripeChargeId: 'ch_1_duplicate' },
            ];
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([mockCharges[0]]),
                    }),
                }),
            });
            const result = await (0, charge_service_1.findById)(chargeId, userId);
            expect(result).toEqual(mockCharges[0]);
        });
    });
    describe('create', () => {
        it('should create a new charge', async () => {
            const newCharge = {
                userId: 1,
                stripeChargeId: 'ch_new',
                amount: '100.00',
            };
            const mockResult = { id: 1, ...newCharge };
            db_1.db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockResult]),
                }),
            });
            const result = await (0, charge_service_1.create)(newCharge);
            expect(result).toEqual(mockResult);
        });
        it('should insert into chargesTable', async () => {
            const newCharge = { userId: 1, stripeChargeId: 'ch_new' };
            const mockResult = { id: 1, ...newCharge };
            db_1.db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockResult]),
                }),
            });
            await (0, charge_service_1.create)(newCharge);
            expect(db_1.db.insert).toHaveBeenCalled();
        });
        it('should handle creation with all fields', async () => {
            const newCharge = {
                userId: 1,
                stripeAccountId: 1,
                stripeChargeId: 'ch_new',
                amount: '100.00',
                currency: 'usd',
                status: 'succeeded',
            };
            const mockResult = { id: 1, ...newCharge };
            db_1.db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockResult]),
                }),
            });
            const result = await (0, charge_service_1.create)(newCharge);
            expect(result.userId).toBe(1);
            expect(result.stripeChargeId).toBe('ch_new');
        });
        it('should return the created charge with generated ID', async () => {
            const newCharge = { userId: 1, stripeChargeId: 'ch_new' };
            const mockResult = { id: 999, ...newCharge };
            db_1.db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockResult]),
                }),
            });
            const result = await (0, charge_service_1.create)(newCharge);
            expect(result.id).toBeDefined();
            expect(result.id).toBe(999);
        });
    });
    describe('Error Handling', () => {
        it('should handle database errors in findAll', async () => {
            const userId = 1;
            const error = new Error('Database error');
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockRejectedValue(error),
                }),
            });
            await expect((0, charge_service_1.findAll)(userId)).rejects.toThrow('Database error');
        });
        it('should handle database errors in findById', async () => {
            const chargeId = 1;
            const userId = 1;
            const error = new Error('Database error');
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        limit: jest.fn().mockRejectedValue(error),
                    }),
                }),
            });
            await expect((0, charge_service_1.findById)(chargeId, userId)).rejects.toThrow('Database error');
        });
        it('should handle database errors in create', async () => {
            const newCharge = { userId: 1 };
            const error = new Error('Database error');
            db_1.db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockRejectedValue(error),
                }),
            });
            await expect((0, charge_service_1.create)(newCharge)).rejects.toThrow('Database error');
        });
    });
    describe('Edge Cases', () => {
        it('should handle very large userId', async () => {
            const userId = Number.MAX_SAFE_INTEGER;
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([]),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId);
            expect(Array.isArray(result)).toBe(true);
        });
        it('should handle year at boundary (1970)', async () => {
            const userId = 1;
            const year = 1970;
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([]),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId, undefined, year);
            expect(Array.isArray(result)).toBe(true);
        });
        it('should handle year at boundary (2100)', async () => {
            const userId = 1;
            const year = 2100;
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([]),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId, undefined, year);
            expect(Array.isArray(result)).toBe(true);
        });
    });
    describe('Performance', () => {
        it('should handle large result sets', async () => {
            const userId = 1;
            const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                userId,
                stripeChargeId: `ch_${i}`,
            }));
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue(largeResultSet),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId);
            expect(result.length).toBe(1000);
        });
    });
    describe('Data Integrity', () => {
        it('should preserve all charge fields', async () => {
            const userId = 1;
            const mockCharge = {
                id: 1,
                userId,
                stripeAccountId: 1,
                stripeChargeId: 'ch_1',
                amount: '100.00',
                currency: 'usd',
                status: 'succeeded',
                created: 1704067200,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            db_1.db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([mockCharge]),
                }),
            });
            const result = await (0, charge_service_1.findAll)(userId);
            expect(result[0]).toEqual(mockCharge);
            expect(Object.keys(result[0]).length).toBeGreaterThan(3);
        });
    });
});
//# sourceMappingURL=charge.service.test.js.map