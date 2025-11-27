export class CacheService {
    constructor() {
        this.storage = localStorage;
        this.prefix = 'gm_cache_';
        this.metaKey = 'gm_cache_meta';
    }

    // Get item from cache, return null if missing or expired
    get(key) {
        const fullKey = this.prefix + key;
        const itemStr = this.storage.getItem(fullKey);

        if (!itemStr) return null;

        try {
            const item = JSON.parse(itemStr);
            const now = new Date().getTime();

            if (now > item.expiry) {
                this.storage.removeItem(fullKey);
                return null;
            }

            return item.value;
        } catch (e) {
            return null;
        }
    }

    // Set item in cache with TTL (in milliseconds)
    set(key, value, ttl = 24 * 60 * 60 * 1000) { // Default 24 hours
        const fullKey = this.prefix + key;
        const now = new Date().getTime();

        const item = {
            value: value,
            expiry: now + ttl
        };

        try {
            this.storage.setItem(fullKey, JSON.stringify(item));
        } catch (e) {
            console.warn('Cache quota exceeded, clearing old items...');
            this.prune();
            try {
                this.storage.setItem(fullKey, JSON.stringify(item));
            } catch (e2) {
                console.error('Failed to cache item even after pruning');
            }
        }
    }

    // Remove specific item
    remove(key) {
        this.storage.removeItem(this.prefix + key);
    }

    // Clear all app cache
    clear() {
        Object.keys(this.storage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                this.storage.removeItem(key);
            }
        });
    }

    // Remove expired items
    prune() {
        const now = new Date().getTime();
        Object.keys(this.storage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const item = JSON.parse(this.storage.getItem(key));
                    if (now > item.expiry) {
                        this.storage.removeItem(key);
                    }
                } catch (e) {
                    this.storage.removeItem(key);
                }
            }
        });
    }

    // Get cache size estimation
    getSize() {
        let size = 0;
        Object.keys(this.storage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                size += this.storage.getItem(key).length;
            }
        });
        return (size / 1024).toFixed(2) + ' KB';
    }
}

export const cacheService = new CacheService();
