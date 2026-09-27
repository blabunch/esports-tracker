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
        // 401/403 від зовнішнього API означають проблему з нашим ключем, а не з гравцем
        if (status === 401 || status === 403) {
            console.error(`❌ External API rejected our credentials (${status}) at ${error.config?.url?.split('?')[0]} — check the API key environment variable`);
            return new HttpError(503, 'This stats provider is temporarily unavailable. Please try again later.');
        }
        if (status === 404) return new HttpError(404, 'Player or match not found');
        if (status === 429) return new HttpError(429, 'External API rate limit exceeded, try again later');
        if (error.code === 'ECONNABORTED') return new HttpError(504, 'External API timed out, try again later');
    }

    return new HttpError(502, fallbackMessage);
};
