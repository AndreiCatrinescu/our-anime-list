import { invoke } from "@tauri-apps/api/core";
import LoginResult from "../components/LoginResult";

export interface Banner {
    image_binary: number[];
    title: string;
    release_day: string;
    release_time: string;
    current_episodes: number;
    total_episodes: number;
}

export const pageSize = 20;

export class BannerLocalMemory {
    private banners: Banner[] = [];
    private changes: { method: string; data: any }[] = [];
    public t: string = "local";

    async login(_userName: string, _password: string): Promise<number> {
        return -1;
    }

    async register(_userName: string, _password: string): Promise<boolean> {
        return false;
    }

    async addBanner(banner: Banner) {
        const initialLength = this.banners.length;
        const exists = this.banners.find(b => b.title === banner.title);
        if (!exists) {
            this.banners.push(banner);
        }
        if (this.banners.length > initialLength) {
            this.changes.push({
                method: "add_banner",
                data: { banner }
            });
        }
    }

    async deleteBanner(title: string) {
        const initialLength = this.banners.length;
        this.banners = this.banners.filter(b => b.title !== title);
        if (this.banners.length < initialLength) {
            this.changes.push({
                method: "delete_banner",
                data: { title }
            });
        }
    }

    async getPagedBanners(pageCount: number): Promise<Banner[]> {
        const start = pageCount * pageSize;
        return this.banners.slice(start, start + pageSize);
    }

    async searchBanners(query: string, pageCount: number): Promise<Banner[]> {
        const start = pageCount * pageSize;
        const end = start + pageSize
        const lowerQuery = query.toLowerCase();
        return this.banners.filter(b => b.title.toLowerCase().includes(lowerQuery)).slice(start, end);
    }

    async getAllBanners(): Promise<Banner[]> {
        return [...this.banners];
    }

    async updateCurrentEpisodes(title: string, currentEpisodes: number) {
        const banner = this.banners.find(b => b.title === title);
        if (banner) {
            banner.current_episodes = currentEpisodes;
            this.changes.push({
                method: "update_banner_current_episodes",
                data: { title, currentEpisodes }
            });
        }
    }

    async updateTotalEpisodes(title: string, totalEpisodes: number) {
        const banner = this.banners.find(b => b.title === title);
        if (banner) {
            banner.total_episodes = totalEpisodes;
            this.changes.push({
                method: "update_banner_total_episodes",
                data: { title, totalEpisodes }
            });
        }
    }

    async updateReleaseDay(title: string, releaseDay: string) {
        const banner = this.banners.find(b => b.title === title);
        if (banner) {
            banner.release_day = releaseDay;
            this.changes.push({
                method: "update_banner_release_day",
                data: { title, releaseDay }
            });
        }
    }

    async updateReleaseTime(title: string, releaseTime: string) {
        const banner = this.banners.find(b => b.title === title);
        if (banner) {
            banner.release_time = releaseTime;
            this.changes.push({
                method: "update_banner_release_time",
                data: { title, releaseTime }
            });
        }
    }

    cacheBanners(banners: Banner[]) {
        this.banners = [...banners];
    }

    getChangeLog(): { method: string; data: any }[] {
        return [...this.changes];
    }
}

export class BannerService {
    public t: string = "back";
    async login(userName: string, password: string): Promise<number> {
        const result = await invoke<LoginResult> ("login", {userName, password});
        switch (result.status) {
            case 'Admin':
                return 0;
            case 'User':
                return 1;
            case 'Fail':
              console.error(result.error);
              return -1;
          }
    }

    async register(userName: string, password: string): Promise<boolean> {
        return await invoke("register_user", { userName, password, isAdmin: false});
    }

    async addBanner(banner: Banner) {
        await invoke ("add_banner", { banner });
    }

    async deleteBanner(id: string) {
        await invoke("delete_banner", { title: id })
    }

    async getPagedBanners(pageCount: number): Promise<Banner[]> {
        return await invoke("get_paged_banners", {pageSize, pageCount})
    }

    async searchBanners(query: string, pageCount: number): Promise<Banner[]> {
        return await invoke("search_banners", { query, pageSize, pageCount })
    }

    async getAllBanners(): Promise<Banner[]> {
        return await invoke("get_all_banners");
    }

    async updateCurrentEpisodes(id: string, current_episodes: number) {
        await invoke("update_banner_current_episodes", { title: id, currentEpisodes: current_episodes });
    }

    async updateTotalEpisodes(id: string, total_episodes: number) {
        await invoke("update_banner_total_episodes", { title: id, totalEpisodes: total_episodes });
    }

    async updateReleaseDay(id: string, release_day: string) {
        await invoke("update_banner_release_day", { title: id, releaseDay: release_day });
    }

    async updateReleaseTime(id: string, release_time: string) {
        await invoke("update_banner_release_time", { title: id, releaseTime: release_time });
    }

    async syncServer (
        changeLog: { method: string; data: any }[]
    ) {
        for (const change of changeLog) {
            await invoke(change.method, change.data);
        }
    }
} 