import React from 'react'
import './ActivityBar.css'

// 简化的 ActivityView 类型 - 移除 explorer
export type ActivityView = 'problems' | 'settings'

interface ActivityBarProps {
  activeView: ActivityView
  onViewChange: (view: ActivityView) => void
  problemCount?: number
}

// 题目管理器图标
const ProblemsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z" fill="currentColor"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.13 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33C5.02 5.25 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.08 2.66 9.34 2.86 9.48L4.89 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.87 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.09 16.37 17.71L18.76 18.67C18.98 18.75 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.15 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z" fill="currentColor"/>
  </svg>
)

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onViewChange,
  problemCount = 0
}) => {
  const handleClick = (view: ActivityView) => {
    if (view === activeView) {
      // Toggle sidebar visibility - handled by parent
      onViewChange(view)
    } else {
      onViewChange(view)
    }
  }

  return (
    <div className="activity-bar">
      <div className="activity-bar-top">
        {/* 题目管理器 - 唯一的主要入口 */}
        <button
          className={`activity-bar-item ${activeView === 'problems' ? 'active' : ''}`}
          onClick={() => handleClick('problems')}
          title="题目管理器"
        >
          <ProblemsIcon />
          {problemCount > 0 && (
            <span className="activity-bar-badge">{problemCount > 99 ? '99+' : problemCount}</span>
          )}
        </button>
      </div>
      <div className="activity-bar-bottom">
        <button
          className={`activity-bar-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => handleClick('settings')}
          title="设置 (⌘,)"
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  )
}

export default ActivityBar
