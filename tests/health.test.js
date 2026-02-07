"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../src/index"));
describe('Health Endpoints', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/health')
                .expect(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });
    });
    describe('GET /ready', () => {
        it('should return readiness status', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/ready')
                .expect(200);
            expect(response.body).toHaveProperty('status', 'ready');
        });
    });
});
//# sourceMappingURL=health.test.js.map