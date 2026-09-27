interface CacheItem {
    data: any;
    expiry: number;
}

class MemoryCache {
    private cache = new Map<string, CacheItem>();
    private readonly MAX_CACHE_SIZE = 500; // 🛡️ Хард ліміт

    set(key: string, data: any, ttlMinutes: number = 5) {
        // Якщо ліміт досягнуто, видаляємо найстаріший запис (FIFO)
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        const expiry = Date.now() + ttlMinutes * 60 * 1000;
        this.cache.set(key, { data, expiry });
    }

    get(key: string): any | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear() {
        this.cache.clear();
    }
}

export const apiCache = new MemoryCache();