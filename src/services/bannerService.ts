export interface Banner {
    id: string;
    imageFile: Blob;
    title: string;
    releaseDay: string;
    releaseTime: string;
    currentEpisodes: number;
    totalEpisodes: number;
}

export class BannerService {
    private banners: Banner[] = [];

    addBanner(banner: Omit<Banner, 'id'>): Banner {
        if (this.banners.some(b => b.title.toLowerCase() === banner.title.toLowerCase())) {
            throw new Error('A banner with this title already exists');
        }

        const newBanner: Banner = {
            ...banner,
            id: crypto.randomUUID()
        };
        this.banners.push(newBanner);
        return newBanner;
    }

    deleteBanner(title: string): Banner[] {
        this.banners = this.banners.filter((banner) => banner.title !== title);
        return [...this.banners];
    }

    searchBanners(query: string): Banner[] {
        const searchQuery = query.toLowerCase();
        return this.banners.filter(banner =>
            banner.title.toLowerCase().includes(searchQuery)
        );
    }

    getAllBanners(): Banner[] {
        return [...this.banners];
    }

    updateBanner(id: string, updates: Partial<Omit<Banner, 'id'>>): void {
        const index = this.banners.findIndex(b => b.id === id);
        if (index !== -1) {
            this.banners[index] = { ...this.banners[index], ...updates };
        }
    }
} 