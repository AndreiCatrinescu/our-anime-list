use crate::banner::Banner;

pub struct BannerRepo {
    banners: Vec<Banner>,
}

pub trait BannerStorage {
    fn add_banner(&mut self, banner: Banner);
    fn delete_banner(&mut self, banner_id: String);
    fn search_banners(&self, query: String) -> Vec<Banner>;
    fn get_all_banners(&self) -> Vec<Banner>;
    fn update_banner_current_episodes(&mut self, banner_id: String, current_episodes: u32);
    fn update_banner_total_episodes(&mut self, banner_id: String, total_episodes: u32);
    fn update_banner_release_day(&mut self, banner_id: String, release_day: String);
    fn update_banner_release_time(&mut self, banner_id: String, release_time: String);
}

impl BannerRepo {
    pub fn new() -> Self {
        BannerRepo {
            banners: Vec::new(),
        }
    }
}

impl BannerStorage for BannerRepo {
    fn add_banner(&mut self, banner: Banner) {
        self.banners.push(banner);
    }

    fn delete_banner(&mut self, banner_id: String) {
        self.banners.retain(|banner| banner.id != banner_id);
    }

    fn search_banners(&self, query: String) -> Vec<Banner> {
        self.banners
            .iter()
            .filter(|banner| banner.title.contains(&query))
            .map(|banner| banner.clone())
            .collect()
    }

    fn get_all_banners(&self) -> Vec<Banner> {
        self.banners.clone()
    }

    fn update_banner_current_episodes(&mut self, banner_id: String, current_episodes: u32) {
        if let Some(banner) = self
            .banners
            .iter_mut()
            .find(|banner| banner.id == banner_id)
        {
            banner.current_episodes = current_episodes;
        }
    }

    fn update_banner_total_episodes(&mut self, banner_id: String, total_episodes: u32) {
        if let Some(banner) = self
            .banners
            .iter_mut()
            .find(|banner| banner.id == banner_id)
        {
            banner.total_episodes = total_episodes;
        }
    }

    fn update_banner_release_day(&mut self, banner_id: String, release_day: String) {
        if let Some(banner) = self
            .banners
            .iter_mut()
            .find(|banner| banner.id == banner_id)
        {
            banner.release_day = release_day;
        }
    }

    fn update_banner_release_time(&mut self, banner_id: String, release_time: String) {
        if let Some(banner) = self
            .banners
            .iter_mut()
            .find(|banner| banner.id == banner_id)
        {
            banner.release_time = release_time;
        }
    }
}
