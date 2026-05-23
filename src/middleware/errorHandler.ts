import { Request, Response, NextFunction } from 'express';
import { sendInternalError } from '../utils/response.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  sendInternalError(res, 'Internal server error', err.message);
};
