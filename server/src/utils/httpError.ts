import axios from 'axios';

// Помилка, повідомлення якої безпечно показувати клієнту
export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'HttpError';
    }
}

// Перетворює помилку зовнішнього API на безпечну HttpError
export const toUpstreamError = (error: unknown, fallbackMessage: string): HttpError => {
    if (error instanceof HttpError) return error;

    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) return new HttpError(404, 'Player or match not found');
        if (status === 429) return new HttpError(429, 'External API rate limit exceeded, try again later');
        if (error.code === 'ECONNABORTED') return new HttpError(504, 'External API timed out, try again later');
    }

    return new HttpError(502, fallbackMessage);
};
