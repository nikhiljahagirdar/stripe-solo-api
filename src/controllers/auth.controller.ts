import type { Request, Response } from 'express';
import { registerUser, authenticateUser, getUserPermissions as getPermissions } from '../services/auth.service';
import { getUserFromToken } from '../utils/auth.utils';
import logger from '../utils/logger';

/**
 * A user registration object for the request body.
 * @typedef {object} UserRegistration
 * @property {string} firstName.required - The user's first name.
 * @property {string} lastName.required - The user's last name.
 * @property {string} email.required - The user's email address.
 * @property {string} password.required - The user's password (min 6 characters).
 * @property {string} [roleName] - The name of the role to assign (e.g., "Admin"). Defaults to "Admin".
 */
/**
 * POST /api/v1/auth/register
 * @summary Register a new user account
 * @description Creates a new user account with email, password, and optional role. This is for user registration/signup, not user management.
 * @tags Auth
 * @param {UserRegistration} request.body.required - The user registration details.
 * @return {object} 201 - Success response with a confirmation message.
 * @example response - 201 - success
 * {
 *   "message": "User registered successfully"
 * }
 * @return {object} 400 - Bad Request - Email and password are required.
 * @return {object} 409 - Conflict - User with this email already exists.
 * @return {object} 500 - Internal Server Error.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, roleName } = req.body;

  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ message: 'First name, last name, email, and password are required' }); return;
  }

  try {
    await registerUser({ firstName, lastName, email, password, roleName });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'User with this email already exists') {
      res.status(409).json({ message: errorMessage }); return;
    }
    logger.error('Registration error:', error);
    res.status(500).json({ message: errorMessage || 'Internal server error' });
  }
};


/**
 * A user login object for the request body.
 * @typedef {object} UserLogin
 * @property {string} email.required - The user's email address.
 * @property {string} password.required - The user's password.
 */

/**
 * A successful login response object.
 * @typedef {object} LoginResponse
 * @property {string} token - The JWT token for authentication.
 * @property {object} user - The authenticated user's details.
 * @property {number} user.id - The user's ID.
 * @property {string} user.firstName - The user's first name.
 * @property {string} user.lastName - The user's last name.
 * @property {string} user.email - The user's email.
 * @property {string} user.role - The user's role name.
 */

/**
 * POST /api/v1/auth/login
 * @summary Log in a user
 * @description Authenticates a user with an email and password, returning a JWT token upon success.
 * @tags Auth
 * @param {UserLogin} request.body.required - The user's login credentials.
 * @return {LoginResponse} 200 - Successful authentication.
 * @return {object} 400 - Bad Request - Email and password are required.
 * @return {object} 401 - Unauthorized - Invalid credentials.
 * @return {object} 500 - Internal Server Error.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' }); return;
  }

  try {
    const result = await authenticateUser(email, password);
    res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'Invalid credentials') {
      res.status(401).json({ message: errorMessage }); return;
    }
    logger.error('Login error:', error);
    res.status(500).json({ message: errorMessage || 'Internal server error' });
  }
};

/**
 * GET /api/v1/auth/permissions
 * @summary Get user RBAC permissions
 * @description Fetches all RBAC pages and user rights based on user ID or role ID.
 * @tags Auth
 * @security BearerAuth
 * @return {object} 200 - User permissions with pages and rights.
 * @property {array<object>} pages - Array of pages with user permissions.
 * @property {number} pages[].id - Page ID.
 * @property {string} pages[].groupName - Page group name.
 * @property {string} pages[].pagename - Page name.
 * @property {string} pages[].pageUrl - Page URL.
 * @property {boolean} pages[].isAdd - Add permission.
 * @property {boolean} pages[].isEdit - Edit permission.
 * @property {boolean} pages[].isDelete - Delete permission.
 * @property {boolean} pages[].isUpdate - Update permission.
 * @property {object} pages[].filters - Page filters.
 * @return {object} 401 - Unauthorized.
 * @return {object} 500 - Internal Server Error.
 */
export const getUserPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' }); return;
    }

    const permissions = await getPermissions(user.id, user.roleId);
    res.status(200).json({ pages: permissions });
  } catch (error) {
    logger.error('Get permissions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

