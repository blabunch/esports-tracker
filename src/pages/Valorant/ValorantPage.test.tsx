import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { gameApi } from '../../api/client';
import { valorantData } from '../../test/fixtures';

afterEach(() => vi.restoreAllMocks());

const mockCommon = () => {
  vi.spyOn(gameApi, 'getOverview').mockResolvedValue({ playersTracked: 0, profilesChecked24h: 0 });
  vi.spyOn(gameApi, 'getProgress').mockResolvedValue([]);
};

describe('ValorantPage', () => {
  it('loads a player directly from a shareable URL', async () => {
    mockCommon();
    const getValorant = vi.spyOn(gameApi, 'getValorant').mockResolvedValue(valorantData);
    window.history.pushState({}, '', '/valorant/TenZ/0505');

    render(<App />);

    expect(await screen.findByText('Radiant', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(getValorant).toHaveBeenCalledWith('TenZ', '0505');
    expect(screen.getByLabelText('Riot ID nickname')).toHaveValue('TenZ');
  });

  it('navigates to the profile URL when searching', async () => {
    mockCommon();
    vi.spyOn(gameApi, 'getValorant').mockResolvedValue(valorantData);
    window.history.pushState({}, '', '/valorant');

    render(<App />);

    await userEvent.type(await screen.findByLabelText('Riot ID nickname'), 'TenZ');
    await userEvent.type(screen.getByLabelText('Riot ID tag'), '0505');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(window.location.pathname).toBe('/valorant/TenZ/0505');
    expect(await screen.findByText('Radiant')).toBeInTheDocument();
  });

  it('shows the API error message when a player is not found', async () => {
    mockCommon();
    vi.spyOn(gameApi, 'getValorant').mockRejectedValue(new Error('Player or match not found'));
    window.history.pushState({}, '', '/valorant/Nobody/0000');

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Player or match not found');
  });
});
