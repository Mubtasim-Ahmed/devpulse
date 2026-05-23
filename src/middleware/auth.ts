import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { sendUnauthorized, sendForbidden } from '../utils/response.js';

export interface JwtPayload {
  id: number;
  name: string;
  email: string;
  role: 'contributor' | 'maintainer';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const extractToken = (authorization: string | undefined): string | null => {
  if (!authorization) {
    return null;
  }
  return authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : authorization.trim();
};

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    sendUnauthorized(res, 'No token provided');
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

export const requireRole = (roles: Array<'contributor' | 'maintainer'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'User not authenticated');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};
