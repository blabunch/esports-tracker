import { describe, expect, it } from 'vitest';
import { cs2Path, dotaPath, historyEntryPath, valorantPath } from './routes';

describe('routes', () => {
  it('builds encoded, shareable profile paths', () => {
    expect(valorantPath(' Tenz ', '0505')).toBe('/valorant/Tenz/0505');
    expect(valorantPath('a/b', '#1')).toBe('/valorant/a%2Fb/%231');
    expect(dotaPath('86745912')).toBe('/dota/86745912');
    expect(cs2Path('s1mple?')).toBe('/cs2/s1mple%3F');
  });

  it('maps history entries to profile paths', () => {
    expect(historyEntryPath('Valorant', 'TenZ#0505')).toBe('/valorant/TenZ/0505');
    expect(historyEntryPath('Valorant', 'broken')).toBeNull();
    expect(historyEntryPath('Dota 2', '123')).toBe('/dota/123');
    expect(historyEntryPath('CS2', 'ZywOo')).toBe('/cs2/ZywOo');
    expect(historyEntryPath('Minecraft', 'x')).toBeNull();
  });
});
