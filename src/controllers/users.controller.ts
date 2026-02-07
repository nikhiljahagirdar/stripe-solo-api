import type { Request, Response } from 'express';
import { getUserFromToken } from '../utils/auth.utils';
import * as userService from '../services/user.service';
import {createDefaultRolePageAssignments} from '../services/rbacPage.service';import logger from '../utils/logger';
/**
 * A user object returned by the API.
 * @typedef {object} User
 * @property {string} id - The user's unique identifier.
 * @property {string} firstName - The user's first name.
 * @property {string} lastName - The user's last name.
 * @property {string} email - The user's email address.
 * @property {string} role - The user's role (admin, manager, user).
 * @property {string} status - The user's status (active, inactive, suspended).
 * @property {string} createdAt - User creation timestamp.
 * @property {string} updatedAt - User last update timestamp.
 * @property {string} lastLoginAt - User's last login timestamp.
 */

/**
 * A detailed user object with additional information.
 * @typedef {object} UserDetailed
 * @property {string} id - The user's unique identifier.
 * @property {string} firstName - The user's first name.
 * @property {string} lastName - The user's last name.
 * @property {string} email - The user's email address.
 * @property {string} role - The user's role (admin, manager, user).
 * @property {string} status - The user's status (active, inactive, suspended).
 * @property {string} createdAt - User creation timestamp.
 * @property {string} updatedAt - User last update timestamp.
 * @property {string} lastLoginAt - User's last login timestamp.
 * @property {array<string>} permissions - Array of user permissions.
 * @property {object} profile - User profile information.
 * @property {string} profile.avatar - User avatar URL.
 * @property {string} profile.phone - User phone number.
 * @property {string} profile.department - User department.
 * @property {string} profile.jobTitle - User job title.
 */

/**
 * Request body for creating a user.
 * @typedef {object} CreateUserRequest
 * @property {string} firstName.required - The user's first name.
 * @property {string} lastName.required - The user's last name.
 * @property {string} email.required - The user's email address.
 * @property {string} password.required - The user's password (minimum 8 characters).
 * @property {string} role.required - The user's role (admin, manager, user).
 * @property {string} [status] - The user's initial status (active, inactive).
 * @property {array<string>} [permissions] - Array of specific permissions to assign.
 */

/**
 * Request body for updating a user. All fields are optional.
 * @typedef {object} UpdateUserRequest
 * @property {string} [firstName] - The user's first name.
 * @property {string} [lastName] - The user's last name.
 * @property {string} [email] - The user's email address.
 * @property {string} [role] - The user's role (admin, manager, user).
 * @property {string} [status] - The user's status (active, inactive, suspended).
 * @property {array<string>} [permissions] - Array of specific permissions to assign.
 */

/**
 * Pagination information object.
 * @typedef {object} PaginationInfo
 * @property {number} currentPage - Current page number.
 * @property {number} pageSize - Number of items per page.
 * @property {number} totalPages - Total number of pages.
 * @property {number} totalCount - Total number of items.
 * @property {boolean} hasNextPage - Whether there is a next page.
 * @property {boolean} hasPreviousPage - Whether there is a previous page.
 */

/**
 * Users list response object.
 * @typedef {object} UsersListResponse
 * @property {boolean} success - Operation success status.
 * @property {array<User>} data - Array of user objects.
 * @property {number} totalCount - Total number of users.
 * @property {PaginationInfo} pagination - Pagination information.
 */

/**
 * Single user response object.
 * @typedef {object} UserResponse
 * @property {boolean} success - Operation success status.
 * @property {UserDetailed} data - User object with detailed information.
 */

/**
 * Success response object.
 * @typedef {object} SuccessResponse
 * @property {boolean} success - Operation success status.
 * @property {string} message - Success message.
 * @property {object} [data] - Optional response data.
 */

/**
 * Error response object.
 * @typedef {object} ErrorResponse
 * @property {boolean} success - Operation success status (false).
 * @property {string} error - Error code.
 * @property {string} message - Error message.
 * @property {object} [details] - Additional error details.
 */

/**
 * GET /api/users
 * @summary List all users with pagination
 * @description Lists all users from the database with pagination, search, sorting, and filtering capabilities.
 * @tags Users
 * @security BearerAuth
 * @param {number} [page=1] page.query - The page number for pagination.
 * @param {number} [pageSize=20] pageSize.query - The number of items per page.
 * @param {string} [query] query.query - A search term to filter users by name or email.
 * @param {string} [sort] sort.query - A sort string in the format 'column:direction' (e.g., 'name:asc').
 * @param {string} [role] role.query - Filter users by role (admin, manager, user).
 * @param {string} [status] status.query - Filter users by status (active, inactive, suspended).
 * @return {object} 200 - An object containing the list of users and the total count.
 * @property {array<User>} data - The array of user objects for the current page.
 * @property {number} totalCount - The total number of users matching the query.
 * @return {object} 401 - Unauthorized - Invalid or missing authentication token.
 * @return {object} 403 - Forbidden - Insufficient permissions to view users.
 * @return {object} 500 - Internal Server Error.
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false, 
        error: 'UNAUTHORIZED', 
        message: 'Authentication token is required' 
      }); return;
    }

    const { page = 1, pageSize = 20, query = '', sort = 'created:desc', status } = req.query;
    
    const [sortBy, sortOrder] = (sort as string).split(':');
    
    const { data: users, pagination: servicePagination } = await userService.getAllUsers({
      page: Number(page as string),
      pageSize: Number(pageSize as string),
      search: query as string,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      status: status as string,
    });
    
    res.status(200).json({
      success: true,
      data: users,
      totalCount: servicePagination.total,
      pagination: {
        currentPage: Number(page as string),
        pageSize: Number(pageSize as string),
        totalPages: servicePagination.totalPages,
        totalCount: servicePagination.total,
        hasNextPage: Number(page as string) * Number(pageSize as string) < servicePagination.total,
        hasPreviousPage: Number(page as string) > 1
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'INTERNAL_ERROR', 
      message: 'An unexpected error occurred' 
    });
  }
};

/**
 * POST /api/users
 * @summary Create a new user
 * @description Creates a new user account with the specified details and role.
 * @tags Users
 * @security BearerAuth
 * @param {CreateUserRequest} request.body.required - The details for the new user.
 * @return {User} 201 - The newly created user record from the database.
 * @return {object} 400 - Bad Request - Invalid input data or validation errors.
 * @return {object} 401 - Unauthorized - Invalid or missing authentication token.
 * @return {object} 403 - Forbidden - Insufficient permissions to create users.
 * @return {object} 409 - Conflict - User with this email already exists.
 * @return {object} 500 - Internal Server Error.
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false, 
        error: 'UNAUTHORIZED', 
        message: 'Authentication token is required' 
      }); return;
    }

    const { firstName, lastName, email, password, role, roleId, status = 'active'  } = req.body;
    const effectiveRoleId = roleId || role;

    if (!firstName || !lastName || !email || !password || !effectiveRoleId) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'First name, last name, email, password, and role are required'
      }); return;
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'DUPLICATE_EMAIL',
        message: 'User with this email already exists'
      }); return;
    }

    // Note: You will need to map the 'role' string to a 'roleId' here.
    // For now, we are passing the data to the service.
    const newUser = await userService.createUser({
      firstName,
      lastName,
      email,
      password,
      roleId: effectiveRoleId, // TODO: Lookup role ID based on role name (admin/manager/user)
      status,
    });
    if (!newUser) {
      res.status(500).json({ success: false, message: 'Failed to create user' });
      return;
    }
     // Attach role name for response

    await createDefaultRolePageAssignments(newUser.id, effectiveRoleId);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'User with this email already exists') {
      res.status(409).json({
        success: false,
        error: 'DUPLICATE_EMAIL',
        message: errorMessage
      }); return;
    }
    logger.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'INTERNAL_ERROR', 
      message: 'An unexpected error occurred' 
    });
  }
};

/**
 * GET /api/users/{userId}
 * @summary Retrieve a single user
 * @description Retrieves a user from the database by its ID.
 * @tags Users
 * @security BearerAuth
 * @param {string} userId.path.required - The ID of the user to retrieve.
 * @return {User} 200 - The requested user object.
 * @return {object} 401 - Unauthorized - Invalid or missing authentication token.
 * @return {object} 403 - Forbidden - Insufficient permissions to view this user.
 * @return {object} 404 - Not Found - User does not exist.
 * @return {object} 500 - Internal Server Error.
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false, 
        error: 'UNAUTHORIZED', 
        message: 'Authentication token is required' 
      }); return;
    }

    const { userId } = req.params;
    
    const userData = await userService.getUserById(Number(userId));
    
    if (!userData) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'User not found'
      }); return;
    }

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'INTERNAL_ERROR', 
      message: 'An unexpected error occurred' 
    });
  }
};

/**
 * PUT /api/users/{userId}
 * @summary Update a user
 * @description Updates a user's details in the database.
 * @tags Users
 * @security BearerAuth
 * @param {string} userId.path.required - The ID of the user to update.
 * @param {UpdateUserRequest} request.body.required - The fields to update.
 * @return {User} 200 - The updated user object from the database.
 * @return {object} 400 - Bad Request - Invalid input data or validation errors.
 * @return {object} 401 - Unauthorized - Invalid or missing authentication token.
 * @return {object} 403 - Forbidden - Insufficient permissions to update this user.
 * @return {object} 404 - Not Found - User does not exist.
 * @return {object} 409 - Conflict - Email already exists for another user.
 * @return {object} 500 - Internal Server Error.
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false, 
        error: 'UNAUTHORIZED', 
        message: 'Authentication token is required' 
      }); return;
    }

    const { userId } = req.params;
    const updateData = req.body;
    
    const updatedUser = await userService.updateUser(Number(userId), updateData);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'INTERNAL_ERROR', 
      message: 'An unexpected error occurred' 
    });
  }
};

/**
 * DELETE /api/users/{userId}
 * @summary Delete a user
 * @description Deletes a user from the database.
 * @tags Users
 * @security BearerAuth
 * @param {string} userId.path.required - The ID of the user to delete.
 * @param {boolean} [force=false] force.query - Force permanent deletion (default is soft delete).
 * @return {object} 200 - Success message confirming deletion.
 * @return {object} 401 - Unauthorized - Invalid or missing authentication token.
 * @return {object} 403 - Forbidden - Insufficient permissions to delete users.
 * @return {object} 404 - Not Found - User does not exist.
 * @return {object} 409 - Conflict - Cannot delete user with active dependencies.
 * @return {object} 500 - Internal Server Error.
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false, 
        error: 'UNAUTHORIZED', 
        message: 'Authentication token is required' 
      }); return;
    }

    const { userId } = req.params;
    
    await userService.deleteUser(Number(userId));
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'INTERNAL_ERROR', 
      message: 'An unexpected error occurred' 
    });
  }
};

/**
 * GET /api/users/{userId}/permissions
 * @summary Get user permissions
 * @description Retrieves all permissions assigned to a specific user.
 * @tags Users
 * @security BearerAuth
 * @param {string} userId.path.required - The ID of the user.
 * @return {object} 200 - An object containing the user's permissions.
 * @property {array<string>} permissions - A list of the user's permissions.
 * @property {array<string>} inheritedFromRole - Permissions inherited from the user's role.
 * @return {object} 401 - Unauthorized - Invalid or missing authentication token.
 * @return {object} 403 - Forbidden - Insufficient permissions to view user permissions.
 * @return {object} 404 - Not Found - User does not exist.
 * @return {object} 500 - Internal Server Error.
 */
export const getUserPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false, 
        error: 'UNAUTHORIZED', 
        message: 'Authentication token is required' 
      }); return;
    }

    const { userId } = req.params;
    
    // Implementation would go here
    const permissions = {
      userId,
      permissions: [],
      inheritedFromRole: []
    };
    
    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Get user permissions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'INTERNAL_ERROR', 
      message: 'An unexpected error occurred' 
    });
  }
};
