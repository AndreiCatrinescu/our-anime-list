use banner::Banner;
use banner_repo::BannerRepo;
use banner_repo::BannerStorage;
use std::sync::RwLock;

mod banner;
mod banner_repo;

type RepoLock<'a> = tauri::State<'a, RwLock<BannerRepo>>;

#[tauri::command]
fn add_banner(banner: Banner, repo: RepoLock<'_>) {
    repo.write().unwrap().add_banner(banner);
}

#[tauri::command]
fn delete_banner(id: String, repo: RepoLock<'_>) {
    repo.write().unwrap().delete_banner(id);
}

#[tauri::command]
fn search_banners(query: String, repo: RepoLock<'_>) -> Vec<Banner> {
    repo.read().unwrap().search_banners(query)
}

#[tauri::command]
fn get_all_banners(repo: RepoLock<'_>) -> Vec<Banner> {
    repo.read().unwrap().get_all_banners()
}

#[tauri::command]
#[allow(non_snake_case)]
fn update_banner_current_episodes(id: String, currentEpisodes: u32, repo: RepoLock<'_>) {
    repo.write()
        .unwrap()
        .update_banner_current_episodes(id, currentEpisodes);
}

#[tauri::command]
#[allow(non_snake_case)]
fn update_banner_total_episodes(id: String, totalEpisodes: u32, repo: RepoLock<'_>) {
    repo.write()
        .unwrap()
        .update_banner_total_episodes(id, totalEpisodes);
}

#[tauri::command]
#[allow(non_snake_case)]
fn update_banner_release_day(id: String, releaseDay: String, repo: RepoLock<'_>) {
    repo.write()
        .unwrap()
        .update_banner_release_day(id, releaseDay);
}

#[tauri::command]
#[allow(non_snake_case)]
fn update_banner_release_time(id: String, releaseTime: String, repo: RepoLock<'_>) {
    repo.write()
        .unwrap()
        .update_banner_release_time(id, releaseTime);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(RwLock::new(BannerRepo::new()))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            add_banner,
            delete_banner,
            search_banners,
            get_all_banners,
            update_banner_current_episodes,
            update_banner_total_episodes,
            update_banner_release_day,
            update_banner_release_time
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
