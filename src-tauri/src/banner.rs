use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Banner {
    pub id: String,
    pub image_binary: Vec<u8>,
    pub title: String,
    pub release_day: String,
    pub release_time: String,
    pub current_episodes: u32,
    pub total_episodes: u32,
}
