use std::time::Duration;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Register the notification plugin here
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let splashscreen = app.get_webview_window("splashscreen").unwrap();
            let main_window = app.get_webview_window("main").unwrap();

            tauri::async_runtime::spawn_blocking(move || {
                std::thread::sleep(Duration::from_millis(3000));
                let _ = main_window.show();
                let _ = main_window.set_focus();
                let _ = splashscreen.close();
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}