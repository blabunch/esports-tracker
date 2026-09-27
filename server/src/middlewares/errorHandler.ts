import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[🔥 Server Error]`, err?.message || err);

    if (res.headersSent) return next(err);

    // Помилки парсингу JSON / завеликого body від express.json()
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'Invalid JSON body', error: 'Invalid JSON body' });
    }
    if (err?.type === 'entity.too.large') {
        return res.status(413).json({ success: false, message: 'Request body is too large', error: 'Request body is too large' });
    }

    // Клієнту показуємо тільки свідомо підготовлені повідомлення, внутрішні деталі (Prisma, стек) — ні
    const isSafe = err instanceof HttpError;
    const statusCode = isSafe ? err.status : 500;
    const message = isSafe ? err.message : 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        error: message,
    });
};
