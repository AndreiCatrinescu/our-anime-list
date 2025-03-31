import { invoke } from "@tauri-apps/api/core";

export interface Banner {
    id: string;
    image_binary: number[];
    title: string;
    release_day: string;
    release_time: string;
    current_episodes: number;
    total_episodes: number;
}

export class BannerService {
    // private banners: Banner[] = [];

    async addBanner(new_banner: Omit<Banner, 'id'>) {
        // if (this.banners.some(b => b.title.toLowerCase() === new_banner.title.toLowerCase())) {
        //     throw new Error('A banner with this title already exists');
        // }

        const banner: Banner = {
            ...new_banner,
            id: crypto.randomUUID()
        };
        // this.banners.push(banner);
        await invoke ("add_banner", { banner });
    }

    async deleteBanner(id: string) {
        // this.banners = this.banners.filter((banner) => banner.id !== id);
        // return [...this.banners];
        await invoke("delete_banner", { id })

    }

    async searchBanners(query: string): Promise<Banner[]> {
        // const searchQuery = query.toLowerCase();
        // return this.banners.filter(banner =>
        //     banner.title.toLowerCase().includes(searchQuery)
        // );
        return await invoke("search_banners", { query })
    }

    async getAllBanners(): Promise<Banner[]> {
        // return [...this.banners];
        return await invoke("get_all_banners");
    }

    async updateCurrentEpisodes(id: string, current_episodes: number) {
        await invoke("update_banner_current_episodes", { id, currentEpisodes: current_episodes });
    }

    async updateTotalEpisodes(id: string, total_episodes: number) {
        await invoke("update_banner_total_episodes", { id, totalEpisodes: total_episodes });
    }

    async updateReleaseDay(id: string, release_day: string) {
        await invoke("update_banner_release_day", { id, releaseDay: release_day });
    }

    async updateReleaseTime(id: string, release_time: string) {
        await invoke("update_banner_release_time", { id, releaseTime: release_time });
    }
} 