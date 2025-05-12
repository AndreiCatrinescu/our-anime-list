use serde::Serialize;
use sqlx::{Row, Sqlite};

use crate::banner::Banner;

#[derive(Serialize)]
#[serde(tag = "status")]
pub enum LoginResult {
    Admin,
    User,
    Fail { error: String },
}

pub struct BannerRepo {
    database: sqlx::Pool<Sqlite>,
}

impl BannerRepo {
    pub fn new(database: sqlx::Pool<Sqlite>) -> Self {
        BannerRepo { database }
    }
}

impl BannerRepo {
    pub async fn login(&self, user_name: String, password: String) -> Result<LoginResult, String> {
        let result = sqlx::query("SELECT user_type, password FROM Users WHERE user_name = ?")
            .bind(user_name)
            .fetch_optional(&self.database)
            .await
            .map_err(|e| e.to_string())?;

        if let Some(row) = result {
            let stored_password: String = row.get("password");
            if password != stored_password {
                return Ok(LoginResult::Fail {
                    error: String::from("invalid password"),
                });
            }

            let user_type: u32 = row.get("user_type");

            return match user_type {
                1 => Ok(LoginResult::User),
                0 => Ok(LoginResult::Admin),
                _ => Err(String::from("what")),
            };
        }

        Ok(LoginResult::Fail {
            error: String::from("user not found"),
        })
    }

    pub async fn register_user(
        &self,
        user_name: String,
        password: String,
        is_admin: bool,
    ) -> Result<bool, String> {
        let user_type = match is_admin {
            true => 0,
            false => 1,
        };
        let result = sqlx::query(
            r#"
                INSERT INTO Users (
                    user_type,
                    password,
                    user_name
                    ) VALUES (?, ?, ?)"#,
        )
        .bind(user_type)
        .bind(password)
        .bind(user_name)
        .execute(&self.database)
        .await;

        match result {
            Ok(_) => Ok(true),
            Err(e) => {
                if let Some(db_err) = e.as_database_error() {
                    let code = db_err.code().map(|c| c.to_string()).unwrap_or_default();

                    if code == "2067" {
                        return Ok(false);
                    }
                }

                Err(e.to_string())
            }
        }
    }

    pub async fn add_banner(&self, banner: Banner, user_name: String) -> Result<(), String> {
        sqlx::query(
            r#"
            INSERT INTO Banners (
                image_binary,
                title,
                release_day,
                release_time,
                current_episodes,
                total_episodes,
                user_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&banner.image_binary)
        .bind(&banner.title)
        .bind(&banner.release_day)
        .bind(&banner.release_time)
        .bind(banner.current_episodes as i64)
        .bind(banner.total_episodes as i64)
        .bind(user_name.clone())
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        let timestamp = time::OffsetDateTime::now_utc()
            .format(&time::format_description::well_known::Rfc3339)
            .unwrap();

        sqlx::query(
            r#"
        INSERT INTO Logs (user_name, action, timestamp)
        VALUES (?, ?, ?)
        "#,
        )
        .bind(user_name)
        .bind("add")
        .bind(timestamp)
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn delete_banner(&self, title: String, user_name: String) -> Result<(), String> {
        sqlx::query(r#"DELETE FROM Banners WHERE title = ? AND user_name = ?"#)
            .bind(title)
            .bind(user_name.clone())
            .execute(&self.database)
            .await
            .map_err(|e| e.to_string())?;

        let timestamp = time::OffsetDateTime::now_utc()
            .format(&time::format_description::well_known::Rfc3339)
            .unwrap();

        sqlx::query(
            r#"
        INSERT INTO Logs (user_name, action, timestamp)
        VALUES (?, ?, ?)
        "#,
        )
        .bind(user_name)
        .bind("delete")
        .bind(timestamp)
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn search_banners(
        &self,
        query: String,
        page_size: usize,
        page_count: usize,
        user_name: String,
    ) -> Result<Vec<Banner>, String> {
        sqlx::query_as(
            r#"
        SELECT * FROM Banners
        WHERE title LIKE ? AND user_name = ?
        LIMIT ? OFFSET ?"#,
        )
        .bind(format!("%{}%", query))
        .bind(user_name)
        .bind(page_size as i64)
        .bind(page_count as i64 * page_size as i64)
        .fetch_all(&self.database)
        .await
        .map_err(|e| e.to_string())
    }

    pub async fn get_all_banners(&self, user_name: String) -> Result<Vec<Banner>, String> {
        sqlx::query_as(r#"SELECT * FROM Banners WHERE user_name = ?"#)
            .bind(user_name)
            .fetch_all(&self.database)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn update_banner_current_episodes(
        &self,
        title: String,
        current_episodes: u32,
        user_name: String,
    ) -> Result<(), String> {
        sqlx::query(
            r#"
        UPDATE Banners
        SET current_episodes = ?
        WHERE title = ? AND user_name = ?"#,
        )
        .bind(current_episodes)
        .bind(title)
        .bind(user_name.clone())
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        let timestamp = time::OffsetDateTime::now_utc()
            .format(&time::format_description::well_known::Rfc3339)
            .unwrap();

        sqlx::query(
            r#"
        INSERT INTO Logs (user_name, action, timestamp)
        VALUES (?, ?, ?)
        "#,
        )
        .bind(user_name)
        .bind("update current episodes")
        .bind(timestamp)
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn update_banner_total_episodes(
        &self,
        title: String,
        total_episodes: u32,
        user_name: String,
    ) -> Result<(), String> {
        sqlx::query(
            r#"
        UPDATE Banners
        SET total_episodes = ?
        WHERE title = ? AND user_name = ?"#,
        )
        .bind(total_episodes)
        .bind(title)
        .bind(user_name.clone())
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        let timestamp = time::OffsetDateTime::now_utc()
            .format(&time::format_description::well_known::Rfc3339)
            .unwrap();

        sqlx::query(
            r#"
        INSERT INTO Logs (user_name, action, timestamp)
        VALUES (?, ?, ?)
        "#,
        )
        .bind(user_name)
        .bind("update total episodes")
        .bind(timestamp)
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn update_banner_release_day(
        &self,
        title: String,
        release_day: String,
        user_name: String,
    ) -> Result<(), String> {
        sqlx::query(
            r#"
        UPDATE Banners
        SET release_day = ?
        WHERE title = ? AND user_name = ?"#,
        )
        .bind(release_day)
        .bind(title)
        .bind(user_name.clone())
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        let timestamp = time::OffsetDateTime::now_utc()
            .format(&time::format_description::well_known::Rfc3339)
            .unwrap();

        sqlx::query(
            r#"
        INSERT INTO Logs (user_name, action, timestamp)
        VALUES (?, ?, ?)
        "#,
        )
        .bind(user_name)
        .bind("update release day")
        .bind(timestamp)
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn update_banner_release_time(
        &self,
        title: String,
        release_time: String,
        user_name: String,
    ) -> Result<(), String> {
        sqlx::query(
            r#"
        UPDATE Banners
        SET release_time = ?
        WHERE title = ? AND user_name = ?"#,
        )
        .bind(release_time)
        .bind(title)
        .bind(user_name.clone())
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        let timestamp = time::OffsetDateTime::now_utc()
            .format(&time::format_description::well_known::Rfc3339)
            .unwrap();

        sqlx::query(
            r#"
        INSERT INTO Logs (user_name, action, timestamp)
        VALUES (?, ?, ?)
        "#,
        )
        .bind(user_name)
        .bind("update release time")
        .bind(timestamp)
        .execute(&self.database)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn sort_banners_by_release_day(
        &self,
        page_size: usize,
        page_count: usize,
        user_name: String,
    ) -> Result<Vec<Banner>, String> {
        sqlx::query_as(
            r#"
            SELECT * FROM banners
            WHERE user_name = ?
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
        .bind(user_name)
        .bind(page_size as i64)
        .bind(page_count as i64 * page_size as i64)
        .fetch_all(&self.database)
        .await
        .map_err(|e| e.to_string())
    }

    pub async fn get_paged_banners(
        &self,
        page_size: usize,
        page_count: usize,
        user_name: String,
    ) -> Result<Vec<Banner>, String> {
        sqlx::query_as(
            r#"
        SELECT * FROM Banners
        WHERE user_name = ?
        LIMIT ? OFFSET ?"#,
        )
        .bind(user_name)
        .bind(page_size as i64)
        .bind(page_count as i64 * page_size as i64)
        .fetch_all(&self.database)
        .await
        .map_err(|e| e.to_string())
    }
}
