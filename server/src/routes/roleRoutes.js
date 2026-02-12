import express from 'express';
import { 
  getAllRoles, 
  getRoleById, 
  createRole, 
  updateRole, 
  deleteRole, 
  updateRolePermissions 
} from '../controllers/RoleController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all roles - requires 'roles.view' permission
router.get('/', authenticateToken, requirePermission('roles.view'), getAllRoles);

// Get role by ID - requires 'roles.view' permission
router.get('/:id', authenticateToken, requirePermission('roles.view'), getRoleById);

// Create new role - requires 'roles.create' permission
router.post('/', authenticateToken, requirePermission('roles.create'), createRole);

// Update role - requires 'roles.update' permission
router.put('/:id', authenticateToken, requirePermission('roles.update'), updateRole);

// Update role permissions - requires 'roles.update' permission
router.patch('/:id/permissions', authenticateToken, requirePermission('roles.update'), updateRolePermissions);

// Delete role - requires 'roles.delete' permission
router.delete('/:id', authenticateToken, requirePermission('roles.delete'), deleteRole);

export default router;