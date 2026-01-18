import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from './logger';

export interface TokenPayload {
  id: number;
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRY = '7d';

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  } catch (error) {
    logger.error(`Error generating token: ${error}`);
    throw error;
  }
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    logger.error(`Error verifying token: ${error}`);
    throw error;
  }
}

/**
 * Decode token without verification
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    logger.error(`Error decoding token: ${error}`);
    return null;
  }
}
