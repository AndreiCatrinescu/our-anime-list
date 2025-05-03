use banner::Banner;
use banner_repo::BannerRepo;
use sqlx::{migrate::MigrateDatabase, Error, Sqlite, SqlitePool};
use std::{env, fs, path::Path};
use tokio::sync::RwLock;

pub mod banner;
pub mod banner_repo;

type RepoLock<'a> = tauri::State<'a, RwLock<BannerRepo>>;

const DB_DIR_NAME: &str = "database";

const BANNER_TABLE_QUERY: &str = r#"
        CREATE TABLE IF NOT EXISTS Banners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_binary BLOB NOT NULL,
            title TEXT NOT NULL,
            release_day TEXT NOT NULL,
            release_time TEXT NOT NULL,
            current_episodes INTEGER NOT NULL,
            total_episodes INTEGER NOT NULL
        )
        "#;

const PATH_TO_DATABASE: &str = "C:\\Users\\x8hnc\\Desktop\\mpp_labs";
fn get_db_creation_path() -> Result<String, std::io::Error> {
    #[cfg(not(debug_assertions))]
    let current_dir = env::current_dir()?.display().to_string();

    #[cfg(debug_assertions)]
    let current_dir = PATH_TO_DATABASE.to_owned();

    Ok(format!("sqlite://{current_dir}/{DB_DIR_NAME}/sqlite.db"))
}

fn set_up_db_directory() -> Result<(), std::io::Error> {
    #[cfg(not(debug_assertions))]
    let current_dir = env::current_dir()?.display().to_string();

    #[cfg(debug_assertions)]
    let current_dir = PATH_TO_DATABASE.to_owned();

    let db_path = format!("{current_dir}/{DB_DIR_NAME}");

    if !Path::new(&db_path).exists() {
        fs::create_dir(db_path)?;
    }

    Ok(())
}

pub async fn set_up_database() -> Result<sqlx::Pool<Sqlite>, Error> {
    let db_url = get_db_creation_path().map_err(sqlx::Error::Io)?;

    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        set_up_db_directory().map_err(sqlx::Error::Io)?;
        Sqlite::create_database(&db_url).await?;
    }

    let db: sqlx::Pool<Sqlite> = SqlitePool::connect(&db_url).await.unwrap();
    sqlx::query(BANNER_TABLE_QUERY).execute(&db).await.unwrap();

    Ok(db)
}

#[tauri::command]
fn check_network() -> bool {
    use std::net::TcpStream;
    TcpStream::connect_timeout(
        &("209.85.233.101:80".parse().unwrap()), // Google's DNS
        std::time::Duration::from_secs(2),
    )
    .is_ok()
}

#[tauri::command]
async fn add_banner(banner: Banner, repo: RepoLock<'_>) -> Result<(), String> {
    repo.write().await.add_banner(banner).await
}

#[tauri::command]
async fn delete_banner(title: String, repo: RepoLock<'_>) -> Result<(), ()> {
    repo.write().await.delete_banner(title).await;
    Ok(())
}

#[tauri::command]
#[allow(non_snake_case)]
async fn search_banners(
    query: String,
    pageSize: usize,
    pageCount: usize,
    repo: RepoLock<'_>,
) -> Result<Vec<Banner>, ()> {
    Ok(repo
        .read()
        .await
        .search_banners(query, pageSize, pageCount)
        .await)
}

#[tauri::command]
#[allow(non_snake_case)]
async fn get_sorted_banners_release_day(
    pageSize: usize,
    pageCount: usize,
    repo: RepoLock<'_>,
) -> Result<Vec<Banner>, ()> {
    Ok(repo
        .read()
        .await
        .sort_banners_by_release_day(pageSize, pageCount)
        .await)
}

#[tauri::command]
async fn get_all_banners(repo: RepoLock<'_>) -> Result<Vec<Banner>, ()> {
    Ok(repo.read().await.get_all_banners().await)
}

#[tauri::command]
#[allow(non_snake_case)]
async fn update_banner_current_episodes(
    title: String,
    currentEpisodes: u32,
    repo: RepoLock<'_>,
) -> Result<(), ()> {
    repo.write()
        .await
        .update_banner_current_episodes(title, currentEpisodes)
        .await;
    Ok(())
}

#[tauri::command]
#[allow(non_snake_case)]
async fn update_banner_total_episodes(
    title: String,
    totalEpisodes: u32,
    repo: RepoLock<'_>,
) -> Result<(), ()> {
    repo.write()
        .await
        .update_banner_total_episodes(title, totalEpisodes)
        .await;
    Ok(())
}

#[tauri::command]
#[allow(non_snake_case)]
async fn update_banner_release_day(
    title: String,
    releaseDay: String,
    repo: RepoLock<'_>,
) -> Result<(), ()> {
    repo.write()
        .await
        .update_banner_release_day(title, releaseDay)
        .await;
    Ok(())
}

#[tauri::command]
#[allow(non_snake_case)]
async fn update_banner_release_time(
    title: String,
    releaseTime: String,
    repo: RepoLock<'_>,
) -> Result<(), ()> {
    repo.write()
        .await
        .update_banner_release_time(title, releaseTime)
        .await;
    Ok(())
}

#[tauri::command]
#[allow(non_snake_case)]
async fn get_paged_banners(
    pageSize: usize,
    pageCount: usize,
    repo: RepoLock<'_>,
) -> Result<Vec<Banner>, ()> {
    Ok(repo
        .read()
        .await
        .get_paged_banners(pageSize, pageCount)
        .await)
}

pub fn run_app(db: sqlx::Pool<Sqlite>) {
    tauri::Builder::default()
        .manage(RwLock::new(BannerRepo::new(db)))
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
