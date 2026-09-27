import { useEffect } from 'react';

const APP_NAME = 'Esports Tracker';

// Назва вкладки для кожної сторінки: у закладках і при шерингу видно, чий це профіль
export const useDocumentTitle = (title?: string) => {
    useEffect(() => {
        document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
    }, [title]);
};
