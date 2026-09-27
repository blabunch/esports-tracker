import React, { useEffect, useState } from 'react';
import { API } from '../../api/client';
import './ServerWakeBanner.scss';

// Безкоштовний хостинг присипляє бекенд після простою, і перший запит може йти до хвилини.
// Якщо сервер не відповів швидко, пояснюємо відвідувачу, що відбувається, замість "зависання".
const SLOW_RESPONSE_MS = 2500;

export const ServerWakeBanner: React.FC = () => {
    const [isWaking, setIsWaking] = useState(false);

    useEffect(() => {
        let finished = false;
        const timer = setTimeout(() => { if (!finished) setIsWaking(true); }, SLOW_RESPONSE_MS);

        API.get('/health', { silent: true, timeout: 90000 })
            .catch(() => undefined)
            .finally(() => {
                finished = true;
                clearTimeout(timer);
                setIsWaking(false);
            });

        return () => clearTimeout(timer);
    }, []);

    if (!isWaking) return null;

    return (
        <div className="server-wake" role="status">
            <span className="server-wake__spinner spinner" aria-hidden="true" />
            <span>
                <strong>Waking up the server…</strong> The free hosting plan sleeps after inactivity, so the first load can take up to a minute.
            </span>
        </div>
    );
};
