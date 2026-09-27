import { useEffect, useState } from 'react';

// Плавний підрахунок від 0 до значення; користувачі з "reduce motion" одразу бачать фінальне число
export const useCountUp = (target: number | undefined, durationMs = 900) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (target === undefined) return;

        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
            const progress = reduceMotion ? 1 : Math.min((now - start) / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, durationMs]);

    return target === undefined ? undefined : value;
};
