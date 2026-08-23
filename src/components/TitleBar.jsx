import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import '../App.css';
export default function TitleBar() {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const updateMaximizedState = async () => {
      setIsMaximized(await appWindow.isMaximized());
    };

    updateMaximizedState();

    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleMinimize = () => appWindow.minimize();
  const handleToggleMaximize = async () => {
    await appWindow.toggleMaximize();
    setIsMaximized(await appWindow.isMaximized());
  };
  const handleClose = () => appWindow.close();

  return (
    <header data-tauri-drag-region className="titlebar">
      <div data-tauri-drag-region className="titlebar-left">
        <div className="app-badge">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span data-tauri-drag-region className="app-title">ZinziraOS</span>
      </div>

      <div className="titlebar-controls">
        <button className="control-btn minimize" onClick={handleMinimize} title="Minimize">
          <svg viewBox="0 0 12 12" width="10" height="10">
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        <button className="control-btn maximize" onClick={handleToggleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
          {isMaximized ? (
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3.5" y="1.5" width="7" height="7" rx="1" />
              <path d="M1.5 3.5v7h7" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1.5" y="1.5" width="9" height="9" rx="1" />
            </svg>
          )}
        </button>

        <button className="control-btn close" onClick={handleClose} title="Close">
          <svg viewBox="0 0 12 12" width="10" height="10" stroke="currentColor" strokeWidth="1.2">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" />
          </svg>
        </button>
      </div>
    </header>
  );
}