use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Serialize, Deserialize, Clone, FromRow)]
pub struct Banner {
    pub image_binary: Vec<u8>,
    pub title: String,
    pub release_day: String,
    pub release_time: String,
    pub current_episodes: u32,
    pub total_episodes: u32,
}
