import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { gameApi } from '../../api/client';
import { ProgressGame, ProgressPoint } from '../../api/types';
import './ProgressChart.scss';

type MetricKey = 'elo' | 'winRate' | 'kd';

const METRICS: Record<ProgressGame, { key: MetricKey; label: string; color: string; suffix?: string }[]> = {
    valorant: [
        { key: 'elo', label: 'MMR', color: '#ff4655' },
        { key: 'kd', label: 'K/D', color: '#ff4655' },
    ],
    cs2: [
        { key: 'elo', label: 'Faceit ELO', color: '#ffa500' },
        { key: 'kd', label: 'K/D', color: '#ffa500' },
    ],
    dota: [
        { key: 'winRate', label: 'Win Rate', color: '#d94b38', suffix: '%' },
    ],
};

const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(date));

// Беремо першу метрику, для якої є хоч одне значення (напр. MMR може бути недоступний)
const pickMetric = (game: ProgressGame, points: ProgressPoint[]) =>
    METRICS[game].find(metric => points.some(point => typeof point[metric.key] === 'number')) || METRICS[game][0];

const formatValue = (value: number, key: MetricKey) => (key === 'kd' ? value.toFixed(2) : String(Math.round(value * 10) / 10));

interface ProgressChartProps {
    game: ProgressGame;
    playerKey: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ game, playerKey }) => {
    const { data: points = [], isLoading, isError } = useQuery({
        queryKey: ['progress', game, playerKey.toLowerCase()],
        queryFn: () => gameApi.getProgress(game, playerKey),
    });

    if (isLoading || isError) return null;

    const metric = pickMetric(game, points);
    const series = points.filter(point => typeof point[metric.key] === 'number');
    const first = series[0]?.[metric.key] as number | undefined;
    const last = series[series.length - 1]?.[metric.key] as number | undefined;
    const delta = first !== undefined && last !== undefined ? last - first : 0;
    const suffix = metric.suffix || '';

    return (
        <section className="progress-chart fade-in-up" aria-label={`${metric.label} progress`}>
            <div className="progress-chart__header">
                <div>
                    <h3 className="progress-chart__title">{metric.label} Progress</h3>
                    <p className="progress-chart__subtitle">
                        {series.length > 1
                            ? `Tracked over ${series.length} days`
                            : 'Tracking started — check back on another day to see the trend'}
                    </p>
                </div>
                {last !== undefined && (
                    <div className="progress-chart__value">
                        <span>{formatValue(last, metric.key)}{suffix}</span>
                        {series.length > 1 && delta !== 0 && (
                            <span className={`progress-chart__delta ${delta > 0 ? 'is-up' : 'is-down'}`}>
                                {delta > 0 ? '▲' : '▼'} {formatValue(Math.abs(delta), metric.key)}{suffix}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {series.length > 1 && (
                <div className="progress-chart__plot">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`progress-${game}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.5} />
                                    <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={48} domain={['auto', 'auto']} />
                            <Tooltip
                                labelFormatter={(label) => formatDate(String(label))}
                                formatter={(value) => [`${formatValue(Number(value), metric.key)}${suffix}`, metric.label]}
                                contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                            />
                            <Area
                                type="monotone"
                                dataKey={metric.key}
                                stroke={metric.color}
                                strokeWidth={3}
                                fill={`url(#progress-${game})`}
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
};
