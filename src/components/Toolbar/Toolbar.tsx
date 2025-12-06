import React from 'react'
import './Toolbar.css'

interface ToolbarProps {
  onNewFile: () => void
  onOpenFile: () => void
  onSaveFile: () => void
  onRun: () => void
  onStop: () => void
  onToggleDarkMode: () => void
  isRunning: boolean
  isCompiling: boolean
  canSave: boolean
  isDarkMode: boolean
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewFile,
  onOpenFile,
  onSaveFile,
  onRun,
  onStop,
  onToggleDarkMode,
  isRunning,
  isCompiling,
  canSave,
  isDarkMode
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-drag-region" />
        <div className="toolbar-buttons">
          <button className="toolbar-btn" onClick={onNewFile} title="New File (⌘N)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h6l4 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            <span>New</span>
          </button>
          <button className="toolbar-btn" onClick={onOpenFile} title="Open File (⌘O)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h4l2 2h6v8H2V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            <span>Open</span>
          </button>
          <button 
            className="toolbar-btn" 
            onClick={onSaveFile} 
            disabled={!canSave}
            title="Save File (⌘S)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h8l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M5 2v4h6V2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M5 10h6v4H5v-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            <span>Save</span>
          </button>
        </div>
      </div>
      
      <div className="toolbar-center">
        <span className="app-title">NotePadC</span>
        <span className="app-subtitle">Turbo C (ANSI C89)</span>
      </div>
      
      <div className="toolbar-right">
        <button 
          className={`toolbar-btn theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
          onClick={onToggleDarkMode}
          title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
        >
          <div className="theme-icon-wrapper">
            {/* 太阳 */}
            <svg className="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {/* 月亮 */}
            <svg className="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
        {isRunning || isCompiling ? (
          <button 
            className="toolbar-btn toolbar-btn-stop" 
            onClick={onStop}
            title="Stop (⌘.)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor"/>
            </svg>
            <span>Stop</span>
          </button>
        ) : (
          <button 
            className="toolbar-btn toolbar-btn-run" 
            onClick={onRun}
            disabled={!canSave && false}
            title="Run (⌘R)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 3l9 5-9 5V3z" fill="currentColor"/>
            </svg>
            <span>{isCompiling ? 'Compiling...' : 'Run'}</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default Toolbar
