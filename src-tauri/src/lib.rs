use banner::Banner;
use banner_repo::BannerRepo;
use banner_repo::BannerStorage;
use std::sync::RwLock;

pub mod banner;
pub mod banner_repo;

type RepoLock<'a> = tauri::State<'a, RwLock<BannerRepo>>;

#[tauri::command]
async fn check_network() -> bool {
    use std::net::TcpStream;
    TcpStream::connect_timeout(
        &("209.85.233.101:80".parse().unwrap()), // Google's DNS
        std::time::Duration::from_secs(2),
    )
    .is_ok()
}

#[tauri::command]
fn add_banner(banner: Banner, repo: RepoLock<'_>) -> Result<(), String> {
    repo.write().unwrap().add_banner(banner)
}

#[tauri::command]
fn delete_banner(title: String, repo: RepoLock<'_>) {
    repo.write().unwrap().delete_banner(title);
}

#[tauri::command]
fn search_banners(query: String, repo: RepoLock<'_>) -> Vec<Banner> {
    repo.read().unwrap().search_banners(query)
}

#[tauri::command]
fn get_sorted_banners_release_day(repo: RepoLock<'_>) -> Vec<Banner> {
    repo.read().unwrap().sort_banners_by_release_day()
}

#[tauri::command]
fn get_all_banners(repo: RepoLock<'_>) -> Vec<Banner> {
    repo.read().unwrap().get_all_banners()
}

#[tauri::command]
#[allow(non_snake_case)]
fn update_banner_current_episodes(title: String, currentEpisodes: u32, repo: RepoLock<'_>) {
    repo.write()
        .unwrap()
        .update_banner_current_episodes(title, currentEpisodes);
}

#[tauri::command]
#[allow(non_snake_case)]
fn update_banner_total_episodes(title: String, totalEpisodes: u32, repo: RepoLock<'_>) {
    repo.write()
        .unwrap()
        .update_banner_total_episodes(title, totalEpisodes);
}

#[tauri::command]
#[allow(non_snake_case)]
fn update_banner_release_day(title: String, releaseDay: String, repo: RepoLock<'_>) {
    repo.write()
        .unwrap()
        .update_banner_release_day(title, releaseDay);
}

#[tauri::command]
#[allow(non_snake_case)]
fn update_banner_release_time(title: String, releaseTime: String, repo: RepoLock<'_>) {
    repo.write()
        .unwrap()
        .update_banner_release_time(title, releaseTime);
}

#[tauri::command]
#[allow(non_snake_case)]
fn get_paged_banners(pageSize: usize, pageCount: usize, repo: RepoLock<'_>) -> Vec<Banner> {
    repo.read().unwrap().get_paged_banners(pageSize, pageCount)
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
            update_banner_release_time,
            get_sorted_banners_release_day,
            get_paged_banners,
            check_network
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
