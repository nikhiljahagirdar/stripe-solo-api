import type { Request, Response, NextFunction } from 'express';
import { findAll } from '../services/card.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * Stripe card object.
 * @typedef {object} StripeCard
 * @property {string} id - Unique identifier for the card
 * @property {string} brand - Card brand (visa, mastercard, etc.)
 * @property {string} last4 - Last 4 digits of the card
 * @property {integer} exp_month - Expiration month
 * @property {integer} exp_year - Expiration year
 * @property {string} country - Two-letter country code
 * @property {string} funding - Card funding type (credit, debit, prepaid)
 * @property {string} customer - Customer ID this card belongs to
 */

/**
 * GET /api/v1/cards
 * @summary List all cards for the authenticated user
 * @description Retrieves all cards associated with the user's customers
 * @tags Cards
 * @security BearerAuth
 * @param {integer} limit.query - Number of cards to return (default: 10, max: 100)
 * @param {string} starting_after.query - Cursor for pagination
 * @param {string} ending_before.query - Cursor for pagination
 * @param {string} customer.query - Filter by customer ID
 * @param {number} [accountId] accountId.query - An account ID to filter cards.
 * @param {integer} [year] year.query - A year to filter cards by creation date (e.g., 2024).
 * @param {integer} [month] month.query - A month (1-12) to filter cards. If omitted, filters entire year.
 * @return {object} 200 - List of cards
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "card_1234567890",
 *       "brand": "visa",
 *       "last4": "4242",
 *       "exp_month": 12,
 *       "exp_year": 2025,
 *       "country": "US",
 *       "funding": "credit",
 *       "customer": "cus_1234567890"
 *     }
 *   ],
 *   "has_more": false,
 *   "total_count": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listCards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const cards = await findAll(user.id, accountId, year, month);
    res.json(cards);
  } catch (error) {
    next(error);
  }
};
