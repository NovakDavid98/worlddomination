import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET not configured');
    res.status(500).json({ 
      success: false, 
      message: 'Server configuration error' 
    });
    return;
  }

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      console.log('JWT verification failed:', err.message);
      res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
      return;
    }

    req.user = user;
    next();
  });
};

export const generateToken = (user: { id: number; username: string; email: string }) => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload = {
    id: user.id,
    username: user.username,
    email: user.email
  };

  // Use direct string for expiresIn, which is valid for jwt.sign
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}; 