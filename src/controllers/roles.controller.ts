import type { Request, Response, NextFunction } from 'express';
import {
  getRoles as getRolesService,
  createRole as createRoleService,
  updateRole as updateRoleService,
  deleteRole as deleteRoleService,
} from '../services/role.service';

/**
 * A Role object.
 * @typedef {object} Role
 * @property {number} id - The role ID.
 * @property {string} name.required - The name of the role.
 */

/**
 * GET /api/roles
 * @summary Retrieve all roles
 * @description Fetches a list of all available user roles.
 * @tags Roles
 * @return {array<Role>} 200 - An array of role objects.
 * @return {object} 500 - Internal Server Error.
 */
export const getRoles = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allRoles = await getRolesService();
    res.status(200).json(allRoles);
  } catch (error) {
    next(error);
  }
};

/**
 * A new Role object for the request body.
 * @typedef {object} NewRole
 * @property {string} name.required - The name for the new role.
 */

/**
 * POST /api/roles
 * @summary Create a new role
 * @description Creates a new user role.
 * @tags Roles
 * @param {NewRole} request.body.required - The role creation details.
 * @return {Role} 201 - The newly created role object.
 * @return {object} 400 - Bad Request - Role name is required.
 * @return {object} 500 - Internal Server Error (e.g., if role name already exists).
 */
export const createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ message: 'Role name is required.' }); return;
  }

  try {
    const newRole = await createRoleService({ name });
    res.status(201).json(newRole);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/roles/{id}
 * @summary Update an existing role
 * @description Updates the name of a specific role by its ID.
 * @tags Roles
 * @param {number} id.path.required - The ID of the role to update.
 * @param {NewRole} request.body.required - The new details for the role.
 * @return {Role} 200 - The updated role object.
 * @return {object} 400 - Bad Request - Role name is required.
 * @return {object} 404 - Not Found - Role not found.
 * @return {object} 500 - Internal Server Error.
 */
export const updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const roleId = Number(req.params['id']);
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ message: 'Role name is required.' }); return;
  }

  try {
    const updatedRole = await updateRoleService(roleId, { name });
    res.status(200).json(updatedRole);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/roles/{id}
 * @summary Delete a role
 * @description Deletes a specific role by its ID. Fails if the role is currently assigned to any users.
 * @tags Roles
 * @param {number} id.path.required - The ID of the role to delete.
 * @return {object} 200 - Success response with a confirmation message.
 * @return {object} 404 - Not Found - Role not found.
 * @return {object} 500 - Internal Server Error (e.g., if role is in use).
 */
export const deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const roleId = Number(req.params['id']);
  try {
    await deleteRoleService(roleId);
    res.status(200).json({ message: 'Role deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
