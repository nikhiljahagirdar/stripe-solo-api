import type { Request, Response } from 'express';
import { TestClockService } from '../services/testClock.service';

const testClockService = new TestClockService();

/**
 * Test clock creation request.
 * @typedef {object} CreateTestClockRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {integer} frozen_time.required - Unix timestamp to freeze time at
 * @property {string} name - Name for the test clock
 */

/**
 * Test clock advance request.
 * @typedef {object} AdvanceTestClockRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {integer} frozenTime.required - Unix timestamp to advance to
 */

/**
 * POST /api/v1/test-clocks
 * @summary Create a new test clock
 * @description Creates a test clock for testing time-based functionality in test mode
 * @tags Test Clocks
 * @security BearerAuth
 * @param {CreateTestClockRequest} request.body.required - Test clock creation data
 * @return {object} 201 - Test clock created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createTestClock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...testClockData } = req.body;
    
    const testClock = await testClockService.create(userId, stripeAccountId, testClockData);
    res.status(201).json(testClock);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/test-clocks
 * @summary List all test clocks for the authenticated user
 * @description Retrieves all test clocks created by the user
 * @tags Test Clocks
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter test clocks.
 * @param {number} [year] year.query - A year to filter test clocks by creation date.
 * @return {array} 200 - List of test clocks
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getTestClocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const testClocks = await testClockService.findByUser(userId, accountId, year);
    res.json(testClocks);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/test-clocks/{id}
 * @summary Retrieve a specific test clock
 * @description Retrieves the details of a test clock
 * @tags Test Clocks
 * @security BearerAuth
 * @param {integer} id.path.required - Test clock ID
 * @return {object} 200 - Test clock details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Test clock not found
 * @return {object} 500 - Internal Server Error
 */
export const getTestClock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const testClock = await testClockService.findById(userId, id);
    if (!testClock) {
      res.status(404).json({ error: 'Test clock not found' }); return;
    }
    
    res.json(testClock);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * POST /api/v1/test-clocks/{id}/advance
 * @summary Advance a test clock
 * @description Advances the test clock to a specified time to simulate time passage
 * @tags Test Clocks
 * @security BearerAuth
 * @param {integer} id.path.required - Test clock ID
 * @param {AdvanceTestClockRequest} request.body.required - Advance data
 * @return {object} 200 - Test clock advanced successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Test clock not found
 * @return {object} 500 - Internal Server Error
 */
export const advanceTestClock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId, frozenTime } = req.body;
    
    const testClock = await testClockService.advance(userId, stripeAccountId, id, frozenTime);
    if (!testClock) {
      res.status(404).json({ error: 'Test clock not found' }); return;
    }
    
    res.json(testClock);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
