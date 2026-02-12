import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { createAuditLog } from '../services/auditService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 menit
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 hari

// Helper function to create activity log
async function logActivity(req, userId, action, description, metadata = {}) {
  try {
    await createAuditLog({
      userId,
      action,
      description,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });
  } catch (logError) {
    console.log('Audit log error:', logError.message);
  }
}


// Generate tokens
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, roleId: user.roleId, roleName: user.role.name },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken() {
  return randomBytes(32).toString('hex');
}

// Login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    // Find user with role
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Generate access token (15 menit)
    const accessToken = generateAccessToken(user);

    // Generate refresh token (7 hari)
    const refreshTokenValue = generateRefreshToken();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // Save refresh token to database
    await prisma.refreshtoken.create({
      data: {
        id: randomBytes(16).toString('hex'),
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
        ipAddress,
        userAgent,
      },
    });

    // Log activity
    await logActivity(
      req,
      user.id,
      'LOGIN',
      'User login berhasil',
      { email: user.email, name: user.name }
    );

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // 7 hari in milliseconds
      path: '/',
    });

    // Return user data and access token (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat login' });
  }
}

// Refresh Token
export async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token tidak ditemukan' });
    }

    // Find refresh token in database
    const storedToken = await prisma.refreshtoken.findUnique({
      where: { token: refreshToken },
      include: { 
        user: {
          include: {
            role: true
          }
        } 
      },
    });


    if (!storedToken) {
      return res.status(401).json({ message: 'Refresh token invalid' });
    }

    // Check if token is revoked
    if (storedToken.revokedAt) {
      return res.status(401).json({ message: 'Refresh token sudah di-revoke' });
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshtoken.delete({
        where: { token: refreshToken },
      });
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(storedToken.user);

    // Skip logging for token refresh to avoid infinite loop
    // await createActivityLog(...)

    res.json({
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat refresh token' });
  }
}

// Logout (revoke refresh token)
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Revoke refresh token in database
      await prisma.refreshtoken.update({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });

      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          await logActivity(
            req,
            decoded.id,
            'LOGOUT',
            'User logout berhasil',
            { email: decoded.email }
          );
        } catch (e) {
          // Token invalid, continue
        }
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat logout' });
  }
}

// Get current user (for testing)
export async function getCurrentUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Return user data excluding password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
}

// Change Password
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password saat ini dan password baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Password saat ini salah' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens (force re-login on all devices)
    await prisma.refreshtoken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    // Log activity
    await logActivity(
      req,
      userId,
      'CHANGE_PASSWORD',
      'User mengubah password',
      { timestamp: new Date().toISOString() }
    );

    res.json({ message: 'Password berhasil diubah. Silakan login kembali.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengubah password' });
  }
}
