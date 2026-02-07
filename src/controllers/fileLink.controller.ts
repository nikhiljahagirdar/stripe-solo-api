import type { Request, Response } from 'express';
import { FileLinkService } from '../services/fileLink.service';

const fileLinkService = new FileLinkService();

/**
 * File link creation request.
 * @typedef {object} CreateFileLinkRequest
 * @property {integer} stripeAccountId.required - Stripe account ID
 * @property {string} file.required - File ID to create link for
 * @property {integer} expires_at - Unix timestamp when the link expires
 * @property {object} metadata - Set of key-value pairs
 */

/**
 * Stripe file link object.
 * @typedef {object} StripeFileLink
 * @property {string} id - Unique identifier for the file link
 * @property {string} file - File ID this link points to
 * @property {string} url - URL to access the file
 * @property {integer} expires_at - Unix timestamp when the link expires
 * @property {boolean} expired - Whether the link has expired
 * @property {number} created - Time at which the file link was created
 */

/**
 * POST /api/v1/file-links
 * @summary Create a new file link
 * @description Creates a shareable link for a file uploaded to Stripe
 * @tags File Links
 * @security BearerAuth
 * @param {CreateFileLinkRequest} request.body.required - File link creation data
 * @return {StripeFileLink} 201 - File link created successfully
 * @return {object} 400 - Bad Request
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createFileLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const { stripeAccountId, ...fileLinkData } = req.body;
    
    const fileLink = await fileLinkService.create(userId, stripeAccountId, fileLinkData);
    res.status(201).json(fileLink);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/file-links
 * @summary List all file links for the authenticated user
 * @description Retrieves all file links created by the user
 * @tags File Links
 * @security BearerAuth
 * @param {number} [accountId] accountId.query - An account ID to filter file links.
 * @param {number} [year] year.query - A year to filter file links by creation date.
 * @return {array} 200 - List of file links
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getFileLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const fileLinks = await fileLinkService.findByUser(userId, accountId, year);
    res.json(fileLinks);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * GET /api/v1/file-links/{id}
 * @summary Retrieve a specific file link
 * @description Retrieves the details of a file link
 * @tags File Links
 * @security BearerAuth
 * @param {integer} id.path.required - File link ID
 * @return {StripeFileLink} 200 - File link details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - File link not found
 * @return {object} 500 - Internal Server Error
 */
export const getFileLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    const id = Number(req.params['id']);
    
    const fileLink = await fileLinkService.findById(userId, id);
    if (!fileLink) {
      res.status(404).json({ error: 'File link not found' }); return;
    }
    
    res.json(fileLink);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};
