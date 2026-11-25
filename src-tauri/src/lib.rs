use tauri_plugin_sql::{Migration, MigrationKind};

/// SQLite database file name inside the app data directory.
pub const DB_URL: &str = "sqlite:crm.db";

fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "initial schema",
        sql: include_str!("../migrations/0000_init.sql"),
        kind: MigrationKind::Up,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DB_URL, migrations())
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
