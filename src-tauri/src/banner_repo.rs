use crate::banner::Banner;
use sqlx::Sqlite;

pub struct BannerRepo {
    // banners: Vec<Banner>,
    database: sqlx::Pool<Sqlite>,
}

// pub trait BannerStorage {
//     fn add_banner(&mut self, banner: Banner) -> Result<(), String>;
//     fn delete_banner(&mut self, title: String);
//     fn search_banners(&self, query: String, page_size: usize, page_count: usize) -> Vec<Banner>;
//     fn get_all_banners(&self) -> Vec<Banner>;
//     fn update_banner_current_episodes(&mut self, title: String, current_episodes: u32);
//     fn update_banner_total_episodes(&mut self, title: String, total_episodes: u32);
//     fn update_banner_release_day(&mut self, title: String, release_day: String);
//     fn update_banner_release_time(&mut self, title: String, release_time: String);
//     fn sort_banners_by_release_day(&self) -> Vec<Banner>;
//     fn get_paged_banners(&self, page_size: usize, page_count: usize) -> Vec<Banner>;
// }

impl BannerRepo {
    pub fn new(database: sqlx::Pool<Sqlite>) -> Self {
        BannerRepo {
            // banners: Vec::new(),
            database,
        }
    }
}

impl BannerRepo {
    pub async fn add_banner(&mut self, banner: Banner) -> Result<(), String> {
        sqlx::query(
            r#"
            INSERT INTO Banners (
                image_binary,
                title,
                release_day,
                release_time,
                current_episodes,
                total_episodes
            ) VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&banner.image_binary)
        .bind(&banner.title)
        .bind(&banner.release_day)
        .bind(&banner.release_time)
        .bind(banner.current_episodes as i64)
        .bind(banner.total_episodes as i64)
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn delete_banner(&mut self, title: String) {
        let _ = sqlx::query(r#"DELETE FROM Banners WHERE title = ?"#)
            .bind(title)
            .execute(&self.database)
            .await;
    }

    pub async fn search_banners(
        &self,
        query: String,
        page_size: usize,
        page_count: usize,
    ) -> Vec<Banner> {
        sqlx::query_as(
            r#"
        SELECT * FROM Banners
        WHERE title LIKE ?
        LIMIT ? OFFSET ?"#,
        )
        .bind(format!("%{}%", query))
        .bind(page_size as i64)
        .bind(page_count as i64 * page_size as i64)
        .fetch_all(&self.database)
        .await
        .unwrap()
    }

    pub async fn get_all_banners(&self) -> Vec<Banner> {
        sqlx::query_as(r#"SELECT * FROM Banners"#)
            .fetch_all(&self.database)
            .await
            .unwrap()
    }

    pub async fn update_banner_current_episodes(&mut self, title: String, current_episodes: u32) {
        let _ = sqlx::query(
            r#"
        UPDATE Banners
        SET current_episodes = ?
        WHERE title = ?"#,
        )
        .bind(current_episodes)
        .bind(title)
        .execute(&self.database)
        .await;
    }

    pub async fn update_banner_total_episodes(&mut self, title: String, total_episodes: u32) {
        let _ = sqlx::query(
            r#"
        UPDATE Banners
        SET total_episodes = ?
        WHERE title = ?"#,
        )
        .bind(total_episodes)
        .bind(title)
        .execute(&self.database)
        .await;
    }

    pub async fn update_banner_release_day(&mut self, title: String, release_day: String) {
        let _ = sqlx::query(
            r#"
        UPDATE Banners
        SET release_day = ?
        WHERE title = ?"#,
        )
        .bind(release_day)
        .bind(title)
        .execute(&self.database)
        .await;
    }

    pub async fn update_banner_release_time(&mut self, title: String, release_time: String) {
        let _ = sqlx::query(
            r#"
        UPDATE Banners
        SET release_time = ?
        WHERE title = ?"#,
        )
        .bind(release_time)
        .bind(title)
        .execute(&self.database)
        .await;
    }

    pub async fn sort_banners_by_release_day(
        &self,
        page_size: usize,
        page_count: usize,
    ) -> Vec<Banner> {
        sqlx::query_as(
            r#"
            SELECT * FROM banners
            ORDER BY 
            ( 
                ( 
                    (CASE release_day
                        WHEN 'Sunday' THEN 0
                        WHEN 'Monday' THEN 1
                        WHEN 'Tuesday' THEN 2
                        WHEN 'Wednesday' THEN 3
                        WHEN 'Thursday' THEN 4
                        WHEN 'Friday' THEN 5
                        WHEN 'Saturday' THEN 6
                        END
                    ) 
                    - strftime('%w', 'now') + 7
                ) % 7
            )
            LIMIT ? OFFSET ?;"#,
        )
        .bind(page_size as i64)
        .bind(page_count as i64 * page_size as i64)
        .fetch_all(&self.database)
        .await
        .unwrap()
    }

    pub async fn get_paged_banners(&self, page_size: usize, page_count: usize) -> Vec<Banner> {
        sqlx::query_as(
            r#"
        SELECT * FROM Banners
        LIMIT ? OFFSET ?"#,
        )
        .bind(page_size as i64)
        .bind(page_count as i64 * page_size as i64)
        .fetch_all(&self.database)
        .await
        .unwrap()
    }
}

// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[test]
//     fn add_banner_not_existing_ok() {
//         let mut repo = BannerRepo::new();
//         let result = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         assert_eq!(Ok(()), result);
//     }

//     #[test]
//     fn add_banner_existing_err() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });
//         let result = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         assert_eq!(
//             Err(String::from("banner with the same title already exists")),
//             result
//         );
//     }

//     #[test]
//     fn delete_banner_existing() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         let size = repo.banners.len();

//         repo.delete_banner(String::from("testtitle"));

//         assert_eq!(size - 1, repo.banners.len());
//     }

//     #[test]
//     fn delete_banner_not_existing() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         let size = repo.banners.len();

//         repo.delete_banner(String::from("nonexist"));

//         assert_eq!(size, repo.banners.len());
//     }

//     #[test]
//     fn search_banners_existing() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         let size = repo.search_banners("test".to_owned()).len();

//         assert_eq!(size, 1);
//     }

//     #[test]
//     fn search_banners_not_existing() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         let size = repo.search_banners("nonexist".to_owned()).len();

//         assert_eq!(size, 0);
//     }

//     #[test]
//     fn update_banner_current_episodes() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         repo.update_banner_current_episodes("testtitle".to_owned(), 2);

//         let banner = &repo.banners[0];

//         assert_eq!(banner.current_episodes, 2);
//     }

//     #[test]
//     fn update_banner_total_episodes() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         repo.update_banner_total_episodes("testtitle".to_owned(), 2);

//         let banner = &repo.banners[0];

//         assert_eq!(banner.total_episodes, 2);
//     }

//     #[test]
//     fn update_banner_release_day() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         repo.update_banner_release_day("testtitle".to_owned(), "newday".to_owned());

//         let banner = &repo.banners[0];

//         assert_eq!(banner.release_day, "newday".to_owned());
//     }

//     #[test]
//     fn update_banner_release_time() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "testday".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         repo.update_banner_release_time("testtitle".to_owned(), "newtime".to_owned());

//         let banner = &repo.banners[0];

//         assert_eq!(banner.release_time, "newtime".to_owned());
//     }

//     #[test]
//     fn sort_banners_by_release_day() {
//         let mut repo = BannerRepo::new();
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle".to_owned(),
//             release_day: "2025-01-03".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });
//         let _ = repo.add_banner(Banner {
//             image_binary: Vec::new(),
//             title: "testtitle2".to_owned(),
//             release_day: "2025-01-04".to_owned(),
//             release_time: "testtime".to_owned(),
//             current_episodes: 1,
//             total_episodes: 2,
//         });

//         let banner = &repo.sort_banners_by_release_day()[0];

//         assert_eq!(banner.title, "testtitle".to_owned());
//     }
// }
