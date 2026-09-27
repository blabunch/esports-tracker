import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): any => {
    const [scheme, token] = req.headers.authorization?.split(' ') || [];

    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

    try {
        const verified = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
        if (typeof verified.userId !== 'number') throw new Error('Invalid token payload');
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid Token' });
    }
};
