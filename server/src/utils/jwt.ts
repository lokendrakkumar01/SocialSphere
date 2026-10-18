import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUserPayload } from '../types';

export const generateAccessToken = (payload: AuthUserPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: AuthUserPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): AuthUserPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUserPayload;
};

export const verifyRefreshToken = (token: string): AuthUserPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthUserPayload;
};
