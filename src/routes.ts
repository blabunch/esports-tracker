// Посилання на профілі гравців — ними можна ділитися, і вони переживають перезавантаження сторінки
const enc = encodeURIComponent;

export const valorantPath = (name: string, tag: string) => `/valorant/${enc(name.trim())}/${enc(tag.trim())}`;
export const dotaPath = (id: string) => `/dota/${enc(id.trim())}`;
export const cs2Path = (nickname: string) => `/cs2/${enc(nickname.trim())}`;

// Назви ігор у збереженій історії пошуку
export const HISTORY_GAME = {
    valorant: 'Valorant',
    dota: 'Dota 2',
    cs2: 'CS2',
} as const;

export const historyEntryPath = (game: string, query: string): string | null => {
    if (game === HISTORY_GAME.valorant) {
        const [name, tag] = query.split('#');
        return name && tag ? valorantPath(name, tag) : null;
    }
    if (game === HISTORY_GAME.dota) return dotaPath(query);
    if (game === HISTORY_GAME.cs2) return cs2Path(query);
    return null;
};
