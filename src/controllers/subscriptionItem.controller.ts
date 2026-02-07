import type { Request, Response } from 'express';
import { SubscriptionItemService } from '../services/subscriptionItem.service';

const subscriptionItemService = new SubscriptionItemService();

/**
 * Subscription item creation request.
 * @typedef {object} CreateSubscriptionItemRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} subscription.required - Subscription ID
 * @property {string} price.required - Price ID for the item
 * @property {integer} quantity - Quantity of the item
 * @property {object} metadata - Set of key-value pairs
 */

/**
 * POST /api/v1/subscription-items
 * @summary Create a new subscription item
 * @description Adds a new item to an existing subscription
 * @tags Subscription Items
 * @security BearerAuth
 * @param {CreateSubscriptionItemRequest} request.body.required - Subscription item creation data
 * @return {object} 201 - Subscription item created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createSubscriptionItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...itemData } = req.body;
    
    const item = await subscriptionItemService.create(userId, stripeAccountId, itemData);
    res.status(201).json(item);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/subscription-items
 * @summary List all subscription items for the authenticated user
 * @description Retrieves all subscription items created by the user
 * @tags Subscription Items
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter subscription items.
 * @param {number} [year] year.query - A year to filter subscription items by creation date.
 * @return {array} 200 - List of subscription items
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getSubscriptionItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const items = await subscriptionItemService.findByUser(userId, accountId, year);
    res.json(items);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/subscription-items/{id}
 * @summary Retrieve a specific subscription item
 * @description Retrieves the details of a subscription item
 * @tags Subscription Items
 * @security BearerAuth
 * @param {integer} id.path.required - Subscription item ID
 * @return {object} 200 - Subscription item details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Subscription item not found
 * @return {object} 500 - Internal Server Error
 */
export const getSubscriptionItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const item = await subscriptionItemService.findById(userId, id);
    if (!item) {
      res.status(404).json({ error: 'Subscription item not found' }); return;
    }
    
    res.json(item);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * PUT /api/v1/subscription-items/{id}
 * @summary Update a subscription item
 * @description Updates an existing subscription item
 * @tags Subscription Items
 * @security BearerAuth
 * @param {integer} id.path.required - Subscription item ID
 * @param {object} request.body.required - Update data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {object} 200 - Subscription item updated successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Subscription item not found
 * @return {object} 500 - Internal Server Error
 */
export const updateSubscriptionItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId, ...updateData } = req.body;
    
    const item = await subscriptionItemService.update(userId, stripeAccountId, id, updateData);
    if (!item) {
      res.status(404).json({ error: 'Subscription item not found' }); return;
    }
    
    res.json(item);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * DELETE /api/v1/subscription-items/{id}
 * @summary Delete a subscription item
 * @description Removes an item from a subscription
 * @tags Subscription Items
 * @security BearerAuth
 * @param {integer} id.path.required - Subscription item ID
 * @param {object} request.body.required - Delete data
 * @param {integer} request.body.stripeAccountId.required - Stripe account ID
 * @return {object} 204 - Subscription item deleted successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Subscription item not found
 * @return {object} 500 - Internal Server Error
 */
export const deleteSubscriptionItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    const { stripeAccountId } = req.body;
    
    const deleted = await subscriptionItemService.delete(userId, stripeAccountId, id);
    if (!deleted) {
      res.status(404).json({ error: 'Subscription item not found' }); return;
    }
    
    res.status(204).send();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};
