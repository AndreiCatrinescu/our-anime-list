use crate::banner::Banner;

pub struct BannerRepo {
    banners: Vec<Banner>,
}

pub trait BannerStorage {
    fn add_banner(&mut self, banner: Banner) -> Result<(), String>;
    fn delete_banner(&mut self, title: String);
    fn search_banners(&self, query: String) -> Vec<Banner>;
    fn get_all_banners(&self) -> Vec<Banner>;
    fn update_banner_current_episodes(&mut self, title: String, current_episodes: u32);
    fn update_banner_total_episodes(&mut self, title: String, total_episodes: u32);
    fn update_banner_release_day(&mut self, title: String, release_day: String);
    fn update_banner_release_time(&mut self, title: String, release_time: String);
}

impl BannerRepo {
    pub fn new() -> Self {
        let mut banners = Vec::new();

        for i in 1..101 {
            banners.push(Banner {
                image_binary: Vec::new(),
                title: i.to_string(),
                release_day: String::from("Monday"),
                release_time: String::from("12:30"),
                current_episodes: 3,
                total_episodes: 4,
            });
        }

        BannerRepo { banners }
    }
}

impl BannerStorage for BannerRepo {
    fn add_banner(&mut self, banner: Banner) -> Result<(), String> {
        if let Some(_) = self
            .banners
            .iter()
            .find(|existing| existing.title == banner.title)
        {
            return Err(String::from("banner with the same title already exists"));
        }
        self.banners.push(banner);

        Ok(())
    }

    fn delete_banner(&mut self, title: String) {
        self.banners.retain(|banner| banner.title != title);
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

    fn update_banner_current_episodes(&mut self, title: String, current_episodes: u32) {
        if let Some(banner) = self.banners.iter_mut().find(|banner| banner.title == title) {
            banner.current_episodes = current_episodes;
        }
    }

    fn update_banner_total_episodes(&mut self, title: String, total_episodes: u32) {
        if let Some(banner) = self.banners.iter_mut().find(|banner| banner.title == title) {
            banner.total_episodes = total_episodes;
        }
    }

    fn update_banner_release_day(&mut self, title: String, release_day: String) {
        if let Some(banner) = self.banners.iter_mut().find(|banner| banner.title == title) {
            banner.release_day = release_day;
        }
    }

    fn update_banner_release_time(&mut self, title: String, release_time: String) {
        if let Some(banner) = self.banners.iter_mut().find(|banner| banner.title == title) {
            banner.release_time = release_time;
        }
    }
}

impl BannerRepo {
    pub fn sort_banners_by_release_day(&self) -> Vec<Banner> {
        let mut sorted = self.banners.clone();
        sorted.sort_by(|banner1, banner2| banner1.release_day.cmp(&banner2.release_day));
        sorted
    }

    pub fn get_paged_banners(&self, page_size: usize, page_count: usize) -> Vec<Banner> {
        if page_size * page_count >= self.banners.len() {
            return vec![];
        }

        let end = if page_size * page_count + page_size <= self.banners.len() {
            page_size * page_count + page_size
        } else {
            self.banners.len()
        };

        self.banners[(page_size * page_count)..end].to_vec()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_banner_not_existing_ok() {
        let mut repo = BannerRepo::new();
        let result = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        assert_eq!(Ok(()), result);
    }

    #[test]
    fn add_banner_existing_err() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });
        let result = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        assert_eq!(
            Err(String::from("banner with the same title already exists")),
            result
        );
    }

    #[test]
    fn delete_banner_existing() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        let size = repo.banners.len();

        repo.delete_banner(String::from("testtitle"));

        assert_eq!(size - 1, repo.banners.len());
    }

    #[test]
    fn delete_banner_not_existing() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        let size = repo.banners.len();

        repo.delete_banner(String::from("nonexist"));

        assert_eq!(size, repo.banners.len());
    }

    #[test]
    fn search_banners_existing() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        let size = repo.search_banners("test".to_owned()).len();

        assert_eq!(size, 1);
    }

    #[test]
    fn search_banners_not_existing() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        let size = repo.search_banners("nonexist".to_owned()).len();

        assert_eq!(size, 0);
    }

    #[test]
    fn update_banner_current_episodes() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        repo.update_banner_current_episodes("testtitle".to_owned(), 2);

        let banner = &repo.banners[0];

        assert_eq!(banner.current_episodes, 2);
    }

    #[test]
    fn update_banner_total_episodes() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        repo.update_banner_total_episodes("testtitle".to_owned(), 2);

        let banner = &repo.banners[0];

        assert_eq!(banner.total_episodes, 2);
    }

    #[test]
    fn update_banner_release_day() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        repo.update_banner_release_day("testtitle".to_owned(), "newday".to_owned());

        let banner = &repo.banners[0];

        assert_eq!(banner.release_day, "newday".to_owned());
    }

    #[test]
    fn update_banner_release_time() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "testday".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        repo.update_banner_release_time("testtitle".to_owned(), "newtime".to_owned());

        let banner = &repo.banners[0];

        assert_eq!(banner.release_time, "newtime".to_owned());
    }

    #[test]
    fn sort_banners_by_release_day() {
        let mut repo = BannerRepo::new();
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle".to_owned(),
            release_day: "2025-01-03".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });
        let _ = repo.add_banner(Banner {
            image_binary: Vec::new(),
            title: "testtitle2".to_owned(),
            release_day: "2025-01-04".to_owned(),
            release_time: "testtime".to_owned(),
            current_episodes: 1,
            total_episodes: 2,
        });

        let banner = &repo.sort_banners_by_release_day()[0];

        assert_eq!(banner.title, "testtitle".to_owned());
    }
}
