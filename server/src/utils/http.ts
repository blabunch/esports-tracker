import axios from 'axios';

// Спільний клієнт для зовнішніх API: без таймауту завислий запит тримає з'єднання вічно
export const http = axios.create({ timeout: 8000 });
