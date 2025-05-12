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
    public currentUser: string = "";
    public isAdmin: boolean = false;
    private banners: Banner[] = [];
    private changes: { method: string; data: any }[] = [];

    async simulate_attack() {
        await invoke ("simulate_attack", {userName: "bobross"});
    }

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
    public currentUser: string = "";
    public isAdmin: boolean = false;

    async simulate_attack() {
        await invoke ("simulate_attack", {userName: "bobross"});
    }

    async login(userName: string, password: string): Promise<number> {
        const result = await invoke<LoginResult> ("login", {userName, password});
        switch (result.status) {
            case 'Admin':
                this.currentUser = userName;
                this.isAdmin = true;
                return 0;
            case 'User':
                this.currentUser = userName;
                this.isAdmin = false;
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
        await invoke ("add_banner", { banner, userName: this.currentUser });
    }

    async deleteBanner(title: string) {
        await invoke("delete_banner", { title, userName: this.currentUser  })
    }

    async getPagedBanners(pageCount: number): Promise<Banner[]> {
        return await invoke("get_paged_banners", {pageSize, pageCount, userName: this.currentUser })
    }

    async searchBanners(query: string, pageCount: number): Promise<Banner[]> {
        return await invoke("search_banners", { query, pageSize, pageCount, userName: this.currentUser  })
    }

    async updateCurrentEpisodes(title: string, current_episodes: number) {
        await invoke("update_banner_current_episodes", { title, currentEpisodes: current_episodes, userName: this.currentUser  });
    }

    async updateTotalEpisodes(title: string, total_episodes: number) {
        await invoke("update_banner_total_episodes", { title, totalEpisodes: total_episodes, userName: this.currentUser  });
    }

    async updateReleaseDay(title: string, release_day: string) {
        await invoke("update_banner_release_day", { title, releaseDay: release_day, userName: this.currentUser });
    }

    async updateReleaseTime(title: string, release_time: string) {
        await invoke("update_banner_release_time", { title, releaseTime: release_time, userName: this.currentUser });
    }

    async syncServer (
        changeLog: { method: string; data: any }[]
    ) {
        for (const change of changeLog) {
            await invoke(change.method, change.data);
        }
    }
} 