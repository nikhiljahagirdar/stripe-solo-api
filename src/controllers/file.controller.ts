import type { Request, Response, NextFunction } from 'express';
import { findAll } from '../services/file.service';
import { getOrCreateStripeClient } from '../services/client.service';
import { getUserFromToken } from '../utils/auth.utils';

/**
 * File upload request.
 * @typedef {object} FileUploadRequest
 * @property {integer} accountId.required - Stripe account ID
 * @property {string} purpose.required - Purpose of the file (identity_document, business_logo, etc.)
 * @property {file} file.required - File to upload (multipart/form-data)
 */

/**
 * Stripe file object.
 * @typedef {object} StripeFile
 * @property {string} id - Unique identifier for the file
 * @property {string} filename - Original filename
 * @property {string} purpose - Purpose of the file
 * @property {integer} size - File size in bytes
 * @property {string} type - MIME type of the file
 * @property {string} url - URL to access the file
 * @property {number} created - Time at which the file was created
 */

/**
 * GET /api/v1/files
 * @summary List all files for the authenticated user
 * @description Retrieves all files uploaded by the user to Stripe
 * @tags Files
 * @security BearerAuth
 * @param {integer} limit.query - Number of files to return (default: 10, max: 100)
 * @param {string} starting_after.query - Cursor for pagination
 * @param {string} ending_before.query - Cursor for pagination
 * @param {string} purpose.query - Filter by file purpose
 * @param {number} [accountId] accountId.query - An account ID to filter files.
 * @param {integer} [year] year.query - A year to filter files by creation date (e.g., 2024).
 * @param {integer} [month] month.query - A month (1-12) to filter files. If omitted, filters entire year.
 * @return {object} 200 - List of files
 * @example response - 200 - Success response
 * {
 *   "data": [
 *     {
 *       "id": "file_1234567890",
 *       "filename": "document.pdf",
 *       "purpose": "identity_document",
 *       "size": 102400,
 *       "type": "application/pdf",
 *       "created": 1635724800
 *     }
 *   ],
 *   "has_more": false,
 *   "total_count": 1
 * }
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 500 - Internal Server Error
 */
export const listFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}
    const accountId = req.query['accountId'] ? Number(req.query['accountId'] as string) : undefined;
    const year = req.query['year'] ? Number(req.query['year'] as string) : undefined;
    const month = req.query['month'] ? Number(req.query['month'] as string) : undefined;

    const files = await findAll(user.id, accountId, year, month);
    res.json(files);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/files
 * @summary Upload a file to Stripe
 * @description Uploads a file to Stripe for use with various purposes like identity verification
 * @tags Files
 * @security BearerAuth
 * @param {FileUploadRequest} request.body.required - File upload data (multipart/form-data)
 * @return {StripeFile} 201 - File uploaded successfully
 * @example response - 201 - Success response
 * {
 *   "id": "file_1234567890",
 *   "filename": "document.pdf",
 *   "purpose": "identity_document",
 *   "size": 102400,
 *   "type": "application/pdf",
 *   "url": "https://files.stripe.com/v1/files/file_1234567890/contents",
 *   "created": 1635724800
 * }
 * @return {object} 400 - Bad Request - Invalid file or missing data
 * @return {object} 401 - Unauthorized - User not authenticated
 * @return {object} 404 - Not Found - Stripe account not found
 * @return {object} 500 - Internal Server Error
 */
export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    const { accountId } = req.body;
    if (!user) {res.status(401).json({ error: 'Unauthorized' }); return;}

    const stripe = await getOrCreateStripeClient(accountId, user.id);
    if (!stripe) {res.status(404).json({ error: 'Stripe account not found' }); return;}

    // Note: File upload would require multer middleware for handling multipart/form-data
    res.json({ message: 'File upload endpoint - requires multer middleware implementation' });
  } catch (error) {
    next(error);
  }
};
