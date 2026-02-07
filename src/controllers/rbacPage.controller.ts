import type { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../utils/auth.utils';
import {
  createPage,
  getAllPages,
  getPageById,
  updatePage,
  deletePage,
  assignRoleToPage,
  getRolePageAssignments,
  updateRolePageAssignment,
  deleteRolePageAssignment,
  getUserPermissions,
  updateUserPermissionsBulk
} from '../services/rbacPage.service';

/**
 * POST /api/v1/rbac/pages
 * @summary Create a new RBAC page
 * @tags RBAC
 * @security BearerAuth
 * @param {object} request.body.required - Page data
 * @param {string} request.body.pagename.required - Page name
 * @param {string} request.body.pageUrl.required - Page URL
 * @return {object} 201 - Page created successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const createRbacPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  
  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  if (!req.body) {
    res.status(400).json({ error: 'Request body is required' }); return;
  }

  const { pagename, pageUrl, groupName } = req.body;

  if (!pagename || !pageUrl) {
    res.status(400).json({ error: 'pagename and pageUrl are required' }); return;
  }

  try {
    const newPage = await createPage({ pagename, pageUrl, groupName: groupName || 'General' });
    res.status(201).json(newPage);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/rbac/pages
 * @summary Get all RBAC pages
 * @tags RBAC
 * @security BearerAuth
 * @return {array<object>} 200 - List of pages
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const listRbacPages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  try {
    const pages = await getAllPages();
    res.status(200).json(pages);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/rbac/pages/{id}
 * @summary Get RBAC page by ID
 * @tags RBAC
 * @security BearerAuth
 * @param {integer} id.path.required - Page ID
 * @return {object} 200 - Page details
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Page not found
 * @return {object} 500 - Internal Server Error
 */
export const getRbacPageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const id = String(req.params['id']);

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  try {
    const page = await getPageById(Number(id));
    if (!page) {
      res.status(404).json({ error: 'Page not found' }); return;
    }
    res.status(200).json(page);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/rbac/pages/{id}
 * @summary Update RBAC page
 * @tags RBAC
 * @security BearerAuth
 * @param {integer} id.path.required - Page ID
 * @param {object} request.body.required - Page data
 * @param {string} request.body.pagename - Page name
 * @param {string} request.body.pageUrl - Page URL
 * @return {object} 200 - Page updated successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Page not found
 * @return {object} 500 - Internal Server Error
 */
export const updateRbacPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const id = String(req.params['id']);
  const { pagename, pageUrl } = req.body;

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  try {
    const updatedPage = await updatePage(Number(id), { pagename, pageUrl });
    if (!updatedPage) {
      res.status(404).json({ error: 'Page not found' }); return;
    }
    res.status(200).json(updatedPage);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/rbac/pages/{id}
 * @summary Delete RBAC page
 * @tags RBAC
 * @security BearerAuth
 * @param {integer} id.path.required - Page ID
 * @return {object} 200 - Page deleted successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const deleteRbacPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const id = String(req.params['id']);

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  try {
    const result = await deletePage(Number(id));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/rbac/role-pages
 * @summary Assign role to page with permissions (single or bulk)
 * @tags RBAC
 * @security BearerAuth
 * @param {object|array} request.body.required - Assignment data (single object or array of objects)
 * @param {integer} request.body.roleId.required - Role ID
 * @param {integer} request.body.pageId.required - Page ID
 * @param {integer} request.body.userid - User ID
 * @param {boolean} request.body.isView - View permission
 * @param {boolean} request.body.isAdd - Add permission
 * @param {boolean} request.body.isEdit - Edit permission
 * @param {boolean} request.body.isDelete - Delete permission
 * @param {boolean} request.body.isUpdate - Update permission
 * @return {object|array} 201 - Assignment(s) created successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const assignRoleToPageController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const { roleId, pageId, userid, isView, isAdd, isEdit, isDelete, isUpdate } = req.body;

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  try {
    const assignment = await assignRoleToPage({
      roleId,
      pageId,
      userid,
      isView,
      isAdd,
      isEdit,
      isDelete,
      isUpdate
    });
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/rbac/role-pages
 * @summary Get role-page assignments
 * @tags RBAC
 * @security BearerAuth
 * @param {integer} roleId.query - Filter by role ID
 * @param {integer} pageId.query - Filter by page ID
 * @return {array<object>} 200 - List of assignments
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getRolePageAssignmentsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const { roleId, pageId } = req.query;

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  try {
    const assignments = await getRolePageAssignments(
      roleId ? Number(roleId as string) : undefined,
      pageId ? Number(pageId as string) : undefined
    );
    res.status(200).json(assignments);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/rbac/role-pages/{id}
 * @summary Update role-page assignment permissions (single or bulk)
 * @tags RBAC
 * @security BearerAuth
 * @param {string} id.path.required - Assignment ID (single ID or comma-separated IDs for bulk)
 * @param {object|array} request.body.required - Permission data (single object or array with id field)
 * @param {integer} request.body.id - Assignment ID (required for array operations)
 * @param {boolean} request.body.isView - View permission
 * @param {boolean} request.body.isAdd - Add permission
 * @param {boolean} request.body.isEdit - Edit permission
 * @param {boolean} request.body.isDelete - Delete permission
 * @param {boolean} request.body.isUpdate - Update permission
 * @return {object|array} 200 - Assignment(s) updated successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Assignment not found
 * @return {object} 500 - Internal Server Error
 */
export const updateRolePageAssignmentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const id = String(req.params['id']);
  const body = req.body;

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  try {
    // Handle bulk update (array in body)
    if (Array.isArray(body)) {
      const ids = body.map((item: any) => item.id);
      const updated = await updateRolePageAssignment(ids, body);
      res.status(200).json(updated);
    }
    // Handle comma-separated IDs in path
    else if (id.includes(',')) {
      const ids = id.split(',').map((i: string) => Number(i.trim()));
      const dataArray = ids.map((assignmentId: number) => ({ id: assignmentId, ...body }));
      const updated = await updateRolePageAssignment(ids, dataArray);
      res.status(200).json(updated);
    }
    // Handle single update
    else {
      const updated = await updateRolePageAssignment(Number(id), body);
      if (!updated) {
        res.status(404).json({ error: 'Assignment not found' }); return;
      }
      res.status(200).json(updated);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/rbac/role-pages/{id}
 * @summary Delete role-page assignment
 * @tags RBAC
 * @security BearerAuth
 * @param {integer} id.path.required - Assignment ID
 * @return {object} 200 - Assignment deleted successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const deleteRolePageAssignmentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const { id } = req.params;

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  try {
    const result = await deleteRolePageAssignment(Number(id));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/rbac/user-permissions
 * @summary Get current user's RBAC permissions
 * @tags RBAC
 * @security BearerAuth
 * @return {array<object>} 200 - User permissions
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const getUserPermissionsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  try {
    const permissions = await getUserPermissions(user.id);
    res.status(200).json(permissions);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/rbac/user-permissions
 * @summary Update current user's RBAC permissions in bulk
 * @tags RBAC
 * @security BearerAuth
 * @param {array<object>} request.body.required - Array of permission updates
 * @param {integer} request.body.id.required - Permission assignment ID
 * @param {boolean} request.body.isView - View permission
 * @param {boolean} request.body.isAdd - Add permission
 * @param {boolean} request.body.isEdit - Edit permission
 * @param {boolean} request.body.isDelete - Delete permission
 * @param {boolean} request.body.isUpdate - Update permission
 * @param {object} request.body.filters - JSON filters
 * @return {array<object>} 200 - Updated permissions
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Internal Server Error
 */
export const updateUserPermissionsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserFromToken(req);
  const permissions = req.body;

  if (!user?.id) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  if (!Array.isArray(permissions)) {
    res.status(400).json({ error: 'Request body must be an array of permissions' }); return;
  }

  try {
    const updatedPermissions = await updateUserPermissionsBulk(user.id, permissions);
    res.status(200).json(updatedPermissions);
  } catch (error) {
    next(error);
  }
};
