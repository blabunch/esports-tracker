import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { gameApi } from './api/client';

afterEach(() => vi.restoreAllMocks());

describe('App', () => {
  it('shows real overview numbers on the homepage', async () => {
    vi.spyOn(gameApi, 'getOverview').mockResolvedValue({ playersTracked: 1234, profilesChecked24h: 56, recentPlayers: [] });

    render(<App />);

    expect(await screen.findByText('1,234', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
    expect(screen.queryByText('300M+')).not.toBeInTheDocument();
  });

  it('links recently tracked players to their profiles', async () => {
    vi.spyOn(gameApi, 'getOverview').mockResolvedValue({
      playersTracked: 2,
      profilesChecked24h: 2,
      recentPlayers: [
        { game: 'cs2', playerKey: 'abc', displayName: 'ZywOo', metrics: { elo: 3328 }, updatedAt: new Date().toISOString() },
        { game: 'valorant', playerKey: 'tenz#0505', displayName: 'TenZ#0505', metrics: { rank: 'Radiant' }, updatedAt: new Date().toISOString() },
      ],
    });

    render(<App />);

    expect(await screen.findByRole('link', { name: /ZywOo/ })).toHaveAttribute('href', '/cs2/ZywOo');
    expect(screen.getByRole('link', { name: /TenZ#0505/ })).toHaveAttribute('href', '/valorant/TenZ/0505');
    expect(screen.getByText('3328 ELO')).toBeInTheDocument();
  });

  it('renders a 404 page for unknown routes', async () => {
    vi.spyOn(gameApi, 'getOverview').mockResolvedValue({ playersTracked: 0, profilesChecked24h: 0, recentPlayers: [] });
    window.history.pushState({}, '', '/does-not-exist');

    render(<App />);

    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
