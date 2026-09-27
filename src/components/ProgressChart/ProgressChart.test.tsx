import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProgressChart } from './ProgressChart';
import { gameApi } from '../../api/client';

afterEach(() => vi.restoreAllMocks());

const renderChart = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ProgressChart game="cs2" playerKey="player-1" />
  </QueryClientProvider>,
);

describe('ProgressChart', () => {
  it('explains that tracking just started when there is one data point', async () => {
    vi.spyOn(gameApi, 'getProgress').mockResolvedValue([{ date: '2026-09-27', elo: 2000 }]);

    renderChart();

    expect(await screen.findByText(/Tracking started/)).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('shows the change between the first and last snapshot', async () => {
    vi.spyOn(gameApi, 'getProgress').mockResolvedValue([
      { date: '2026-09-25', elo: 2000 },
      { date: '2026-09-26', elo: 2050 },
      { date: '2026-09-27', elo: 2120 },
    ]);

    renderChart();

    expect(await screen.findByText('Tracked over 3 days')).toBeInTheDocument();
    expect(screen.getByText(/▲ 120/)).toBeInTheDocument();
  });

  it('falls back to K/D when ELO is unavailable', async () => {
    vi.spyOn(gameApi, 'getProgress').mockResolvedValue([{ date: '2026-09-27', elo: null, kd: 1.234 }]);

    renderChart();

    expect(await screen.findByText('K/D Progress')).toBeInTheDocument();
    expect(screen.getByText('1.23')).toBeInTheDocument();
  });
});
