import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { query } from '../../config/database.js';
import { hashPassword, comparePassword } from '../../utils/crypto.js';
import {
  sendCreated,
  sendOk,
  sendBadRequest,
  sendUnauthorized,
  sendConflict,
  sendInternalError,
} from '../../utils/response.js';
import type { UserPublic, UserRole, UserRow } from '../../types/index.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
    };

    if (!name || !email || !password) {
      sendBadRequest(res, 'Name, email, and password are required');
      return;
    }

    if (role && !['contributor', 'maintainer'].includes(role)) {
      sendBadRequest(res, 'Role must be contributor or maintainer');
      return;
    }

    const emailCheck = await query<{ id: number }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      sendConflict(res, 'Email already registered', 'Email must be unique');
      return;
    }

    const hashedPassword = await hashPassword(password);
    const userRole: UserRole = role ?? 'contributor';

    const result = await query<UserPublic>(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, hashedPassword, userRole]
    );

    sendCreated(res, 'User registered successfully', result.rows[0]);
  } catch (error) {
    console.error('Signup error:', error);
    sendInternalError(res, 'Registration failed', (error as Error).message);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      sendBadRequest(res, 'Email and password are required');
      return;
    }

    const result = await query<UserRow>(
      'SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    const user = result.rows[0];
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    sendOk(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    sendInternalError(res, 'Login failed', (error as Error).message);
  }
});

export default router;
