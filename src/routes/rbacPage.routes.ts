import { Router } from 'express';
import {
  createRbacPage,
  listRbacPages,
  getRbacPageById,
  updateRbacPage,
  deleteRbacPage,
  assignRoleToPageController,
  getRolePageAssignmentsController,
  updateRolePageAssignmentController,
  deleteRolePageAssignmentController,
  getUserPermissionsController,
  updateUserPermissionsController
} from '../controllers/rbacPage.controller';

const router = Router();

// RBAC Pages routes

/**
 * @swagger
 * /rbac/pages:
 *   post:
 *     summary: Create a new RBAC page
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               path:
 *                 type: string
 *     responses:
 *       201:
 *         description: Page created successfully
 */
router.post('/pages',  createRbacPage);

/**
 * @swagger
 * /rbac/pages:
 *   get:
 *     summary: List all RBAC pages
 *     tags: [RBAC]
 *     responses:
 *       200:
 *         description: List of pages
 */
router.get('/pages',  listRbacPages);

/**
 * @swagger
 * /rbac/pages/{id}:
 *   get:
 *     summary: Get RBAC page by ID
 *     tags: [RBAC]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page details
 */
router.get('/pages/:id',  getRbacPageById);

/**
 * @swagger
 * /rbac/pages/{id}:
 *   put:
 *     summary: Update an existing RBAC page
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               path:
 *                 type: string
 *     responses:
 *       200:
 *         description: Page updated successfully
 */
router.put('/pages/:id',  updateRbacPage);

/**
 * @swagger
 * /rbac/pages/{id}:
 *   delete:
 *     summary: Delete an RBAC page
 *     tags: [RBAC]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Page deleted
 */
router.delete('/pages/:id',  deleteRbacPage);

// Role-Page assignments routes
router.post('/role-pages',  assignRoleToPageController);
router.get('/role-pages',  getRolePageAssignmentsController);
router.put('/role-pages/:id',  updateRolePageAssignmentController);
router.delete('/role-pages/:id',  deleteRolePageAssignmentController);

// User permissions route
router.get('/user-permissions',  getUserPermissionsController);
router.put('/user-permissions',  updateUserPermissionsController);

export default router;