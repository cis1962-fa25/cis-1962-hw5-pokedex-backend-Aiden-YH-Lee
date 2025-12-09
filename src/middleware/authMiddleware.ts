import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request interface to include the user information
declare global {
    namespace Express {
        interface Request {
            user?: {
                pennkey: string;
            };
        }
    }
}

export const generateToken = (req: Request, res: Response) => {
    const pennkey = req.body?.pennkey;

    if (!pennkey) {
        res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing pennkey in request body' });
        return;
    }

    const secret = process.env.JWT_TOKEN_SECRET;
    if (!secret) {
        console.error('JWT_TOKEN_SECRET is not defined');
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Server configuration error' });
        return;
    }

    const token = jwt.sign({ pennkey }, secret, { expiresIn: '1h' });

    res.status(200).json({ token });
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing Authorization header' });
        return;
    }

    // Expect format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid Authorization header format' });
        return;
    }

    const token = parts[1];
    const secret = process.env.JWT_TOKEN_SECRET;

    if (!secret) {
        console.error('JWT_TOKEN_SECRET is not defined');
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Server configuration error' });
        return;
    }

    if (!token) {
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing token' });
        return;
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
            return;
        }

        if (decoded && typeof decoded === 'object' && 'pennkey' in decoded) {
            req.user = { pennkey: (decoded as any).pennkey };
            next();
        } else {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid token payload' });
        }
    });
};
