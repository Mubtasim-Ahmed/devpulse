import { Response } from 'express';
import StatusCodes from 'http-status-codes';

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string | null;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message?: string,
  data?: T
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    ...(message !== undefined ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: string | null
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  message: string,
  data: T
): Response => {
  return sendSuccess(res, StatusCodes.CREATED, message, data);
};

export const sendOk = <T>(
  res: Response,
  message?: string,
  data?: T
): Response => {
  return sendSuccess(res, StatusCodes.OK, message, data);
};

export const sendBadRequest = (
  res: Response,
  message: string,
  errors?: string | null
): Response => {
  return sendError(res, StatusCodes.BAD_REQUEST, message, errors);
};

export const sendUnauthorized = (res: Response, message: string): Response => {
  return sendError(res, StatusCodes.UNAUTHORIZED, message);
};

export const sendForbidden = (res: Response, message: string): Response => {
  return sendError(res, StatusCodes.FORBIDDEN, message);
};

export const sendNotFound = (res: Response, message: string): Response => {
  return sendError(res, StatusCodes.NOT_FOUND, message);
};

export const sendConflict = (
  res: Response,
  message: string,
  errors?: string | null
): Response => {
  return sendError(res, StatusCodes.CONFLICT, message, errors);
};

export const sendInternalError = (
  res: Response,
  message: string,
  errors?: string | null
): Response => {
  return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, message, errors);
};
