import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { gameApi } from './api/client';

afterEach(() => vi.restoreAllMocks());

describe('App', () => {
  it('shows real overview numbers on the homepage', async () => {
    vi.spyOn(gameApi, 'getOverview').mockResolvedValue({ playersTracked: 1234, profilesChecked24h: 56 });

    render(<App />);

    expect(await screen.findByText('1,234', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
    expect(screen.queryByText('300M+')).not.toBeInTheDocument();
  });

  it('renders a 404 page for unknown routes', async () => {
    vi.spyOn(gameApi, 'getOverview').mockResolvedValue({ playersTracked: 0, profilesChecked24h: 0 });
    window.history.pushState({}, '', '/does-not-exist');

    render(<App />);

    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
