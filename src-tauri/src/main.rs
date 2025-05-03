#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use our_anime_list_lib::*;

#[tokio::main]
async fn main() {
    match set_up_database().await {
        Ok(db) => run_app(db),
        Err(error) => {
            eprintln!("{}", error);
            return;
        }
    }
}
