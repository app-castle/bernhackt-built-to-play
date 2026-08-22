// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use rdev::{listen, EventType};
use serde::Serialize;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
struct KeystrokeBatch {
    count: u64,
}

const EMIT_INTERVAL: Duration = Duration::from_secs(5);
const KEYSTROKE_EVENT: &str = "keystroke-batch";

// Global key hook: works regardless of window focus, which is the point.
// Only the KeyPress *variant* is inspected here, never the associated Key
// value, so no key identity is ever read out, stored, or transmitted.
fn spawn_keystroke_listener(counter: Arc<AtomicU64>) {
    thread::spawn(move || {
        println!("[keystrokes] listener thread starting, attaching global hook...");
        if let Err(error) = listen(move |event| {
            if matches!(event.event_type, EventType::KeyPress(_)) {
                let pending = counter.fetch_add(1, Ordering::Relaxed) + 1;
                println!("[keystrokes] keypress detected (pending = {})", pending);
            }
        }) {
            eprintln!("[keystrokes] listener unavailable: {:?}", error);
        }
    });
}

fn spawn_keystroke_emitter(app_handle: AppHandle, counter: Arc<AtomicU64>) {
    thread::spawn(move || loop {
        thread::sleep(EMIT_INTERVAL);
        let count = counter.swap(0, Ordering::Relaxed);
        println!("[keystrokes] emit tick, delta = {}", count);
        if count > 0 {
            match app_handle.emit(KEYSTROKE_EVENT, KeystrokeBatch { count }) {
                Ok(()) => println!("[keystrokes] emitted batch of {} to frontend", count),
                Err(error) => eprintln!("[keystrokes] failed to emit batch: {:?}", error),
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let counter = Arc::new(AtomicU64::new(0));
            spawn_keystroke_listener(counter.clone());
            spawn_keystroke_emitter(app.handle().clone(), counter);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
