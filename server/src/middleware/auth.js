import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function authenticateToken(req, res, next) {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user with role and permissions
    const userWithRole = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: true
      }
    });

    if (!userWithRole) {
      // Return 401 to force re-authentication/logout
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user and permissions to request
    req.user = userWithRole;
    req.permissions = userWithRole.role.permissions;
    
    next();
  } catch (err) {
    // Return 401 to allow client to try refreshing the token
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Check if user has specific role
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

// Check if user has specific permission
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.permissions.includes(permission)) {
      return res.status(403).json({ message: `Insufficient permissions. Missing: ${permission}` });
    }

    next();
  };
}

// Check if user has any of the specified permissions
export function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const hasPermission = permissions.some(permission => 
      req.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Insufficient permissions. Requires one of: ${permissions.join(', ')}` 
      });
    }

    next();
  };
}

// Check if user has all of the specified permissions
export function requireAllPermissions(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const missingPermissions = permissions.filter(permission => 
      !req.permissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      return res.status(403).json({ 
        message: `Insufficient permissions. Missing: ${missingPermissions.join(', ')}` 
      });
    }

    next();
  };
}