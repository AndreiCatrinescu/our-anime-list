use banner::Banner;
use banner_repo::{BannerRepo, LoginResult};
use sqlx::{migrate::MigrateDatabase, sqlite::SqliteConnectOptions, Error, Sqlite, SqlitePool};
use std::collections::HashMap;
use std::{env, fs, path::Path, str::FromStr};
use std::{thread, vec};
use tauri::Emitter;

pub mod banner;
pub mod banner_repo;

type RepoLock<'a> = tauri::State<'a, BannerRepo>;

const DB_DIR_NAME: &str = "database";

const DB_INIT: &str = r#"
        CREATE TABLE IF NOT EXISTS Users (
            user_type INTEGER NOT NULL,
            password TEXT NOT NULL,
            user_name TEXT PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS Banners (
            image_binary BLOB NOT NULL,
            title TEXT,
            release_day TEXT NOT NULL,
            release_time TEXT NOT NULL,
            current_episodes INTEGER NOT NULL,
            total_episodes INTEGER NOT NULL,
            user_name TEXT REFERENCES Users(user_name),
            PRIMARY KEY (user_name, title)
        );

        CREATE TABLE IF NOT EXISTS Logs (
            user_name TEXT REFERENCES Users(user_name),
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            timestamp TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS SuspiciousUsers (
            user_name TEXT REFERENCES Users(user_name),
            PRIMARY KEY (user_name)
        );
        "#;

const ADMIN_INSERT: &str = r#"
        INSERT INTO Users (
                user_type,
                password,
                user_name
        ) VALUES (0, 'adminpassword', 'admin');

        INSERT INTO Users (
            user_type,
            password,
            user_name
        ) VALUES (1, 'pass', 'bobross');
"#;

const MONITOR_INTERVAL: u64 = 10;

const SUS_ACTION_COUNT: usize = 10;

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
    let mut db_existed = true;

    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        set_up_db_directory().map_err(sqlx::Error::Io)?;
        Sqlite::create_database(&db_url).await?;
        db_existed = false;
    }

    let options = SqliteConnectOptions::from_str(&db_url)?
        .create_if_missing(true)
        .pragma("foreign_keys", "ON");

    let db: sqlx::Pool<Sqlite> = SqlitePool::connect_with(options).await?;
    sqlx::query(DB_INIT).execute(&db).await?;

    if !db_existed {
        sqlx::query(ADMIN_INSERT).execute(&db).await?;
    }

    Ok(db)
}

#[tauri::command]
#[allow(non_snake_case)]
async fn simulate_attack(userName: String, repo: RepoLock<'_>) -> Result<(), String> {
    for i in 0..100 {
        let banner = Banner {
            image_binary: vec![],
            title: i.to_string(),
            release_day: String::from("Monday"),
            release_time: String::from("10:00"),
            current_episodes: 1,
            total_episodes: 10,
        };
        repo.add_banner(banner, userName.clone()).await?;
    }

    Ok(())
}

#[tauri::command]
#[allow(non_snake_case)]
async fn login(
    userName: String,
    password: String,
    repo: RepoLock<'_>,
) -> Result<LoginResult, String> {
    repo.login(userName, password).await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn register_user(
    userName: String,
    password: String,
    isAdmin: bool,
    repo: RepoLock<'_>,
) -> Result<bool, String> {
    repo.register_user(userName, password, isAdmin).await
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
#[allow(non_snake_case)]
async fn add_banner(banner: Banner, userName: String, repo: RepoLock<'_>) -> Result<(), String> {
    repo.add_banner(banner, userName).await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn delete_banner(title: String, userName: String, repo: RepoLock<'_>) -> Result<(), String> {
    repo.delete_banner(title, userName).await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn search_banners(
    query: String,
    pageSize: usize,
    pageCount: usize,
    userName: String,
    repo: RepoLock<'_>,
) -> Result<Vec<Banner>, String> {
    repo.search_banners(query, pageSize, pageCount, userName)
        .await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn get_sorted_banners_release_day(
    pageSize: usize,
    pageCount: usize,
    userName: String,
    repo: RepoLock<'_>,
) -> Result<Vec<Banner>, String> {
    repo.sort_banners_by_release_day(pageSize, pageCount, userName)
        .await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn get_all_banners(userName: String, repo: RepoLock<'_>) -> Result<Vec<Banner>, String> {
    repo.get_all_banners(userName).await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn update_banner_current_episodes(
    title: String,
    currentEpisodes: u32,
    userName: String,
    repo: RepoLock<'_>,
) -> Result<(), String> {
    repo.update_banner_current_episodes(title, currentEpisodes, userName)
        .await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn update_banner_total_episodes(
    title: String,
    totalEpisodes: u32,
    userName: String,
    repo: RepoLock<'_>,
) -> Result<(), String> {
    repo.update_banner_total_episodes(title, totalEpisodes, userName)
        .await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn update_banner_release_day(
    title: String,
    releaseDay: String,
    userName: String,
    repo: RepoLock<'_>,
) -> Result<(), String> {
    repo.update_banner_release_day(title, releaseDay, userName)
        .await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn update_banner_release_time(
    title: String,
    releaseTime: String,
    userName: String,
    repo: RepoLock<'_>,
) -> Result<(), String> {
    repo.update_banner_release_time(title, releaseTime, userName)
        .await
}

#[tauri::command]
#[allow(non_snake_case)]
async fn get_paged_banners(
    pageSize: usize,
    pageCount: usize,
    userName: String,
    repo: RepoLock<'_>,
) -> Result<Vec<Banner>, String> {
    repo.get_paged_banners(pageSize, pageCount, userName).await
}

async fn monitor_db(db: sqlx::Pool<Sqlite>, app_handle: tauri::AppHandle) {
    let mut ticker = tokio::time::interval(tokio::time::Duration::from_secs(MONITOR_INTERVAL));
    loop {
        ticker.tick().await;

        if let Err(e) = check_for_attacks(&db, &app_handle).await {
            eprintln!("Error checking logs: {:?}", e);
        }
    }
}

async fn check_for_attacks(
    db: &sqlx::Pool<Sqlite>,
    app_handle: &tauri::AppHandle,
) -> Result<(), sqlx::Error> {
    let now = time::OffsetDateTime::now_utc();
    let cutoff = now - tokio::time::Duration::from_secs(MONITOR_INTERVAL);
    let logs: Vec<(String, String)> = sqlx::query_as(
        r#"
        SELECT user_name, timestamp
        FROM Logs
        WHERE timestamp >= ?
        "#,
    )
    .bind(
        cutoff
            .format(&time::format_description::well_known::Rfc3339)
            .unwrap(),
    )
    .fetch_all(db)
    .await?;

    let mut user_actions: HashMap<String, usize> = HashMap::new();

    for (user, _) in logs {
        *user_actions.entry(user).or_insert(0) += 1;
    }

    for (user, count) in user_actions {
        if count >= SUS_ACTION_COUNT {
            notify_attack(&user, app_handle);
            sqlx::query(
                r#"
                INSERT INTO SuspiciousUsers (user_name) VALUES (?);
            "#,
            )
            .bind(&user)
            .execute(db)
            .await?;
        }
    }

    Ok(())
}

fn notify_attack(user_name: &str, app_handle: &tauri::AppHandle) {
    app_handle.emit("attack_detected", user_name).unwrap();
}

pub fn run_app(db: sqlx::Pool<Sqlite>) {
    let monitor_pool = db.clone();

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();

            thread::spawn(move || {
                let async_runtime = tokio::runtime::Runtime::new().unwrap();
                async_runtime.block_on(async move {
                    monitor_db(monitor_pool, app_handle).await;
                })
            });

            Ok(())
        })
        .manage(BannerRepo::new(db))
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
            check_network,
            register_user,
            login,
            simulate_attack
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
