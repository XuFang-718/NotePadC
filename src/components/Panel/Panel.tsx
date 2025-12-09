import React, { useState, useCallback } from 'react'
import './Panel.css'

export type PanelTab = 'terminal' | 'output'

interface PanelProps {
  activeTab: PanelTab
  onTabChange: (tab: PanelTab) => void
  width: number  // 改为宽度
  onResize: (width: number) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onClear: () => void
  children: React.ReactNode
}

// Icons
const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 011-1h3a1 1 0 011 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z"/>
  </svg>
)

export const Panel: React.FC<PanelProps> = ({
  activeTab,
  onTabChange,
  width,
  onResize,
  isCollapsed,
  onToggleCollapse,
  onClear,
  children
}) => {
  const [isDragging, setIsDragging] = useState(false)

  // 水平拖拽调整宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const startX = e.clientX
    const startWidth = width

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX
      // 限制宽度在 280px 到 50% 窗口宽度之间
      const maxWidth = window.innerWidth * 0.5
      const newWidth = Math.max(280, Math.min(maxWidth, startWidth + delta))
      onResize(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width, onResize])

  if (isCollapsed) {
    return null
  }

  return (
    <div className="panel" style={{ width }}>
      {/* 左侧拖拽调整手柄 */}
      <div 
        className={`panel-resize-handle ${isDragging ? 'active' : ''}`}
        onMouseDown={handleMouseDown}
      />

      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-tabs">
          <button
            className={`panel-tab ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => onTabChange('terminal')}
          >
            TERMINAL
          </button>
        </div>
        <div className="panel-actions">
          <button 
            className="panel-action-btn" 
            onClick={onClear}
            title="清除"
          >
            <ClearIcon />
          </button>
          <button 
            className="panel-action-btn" 
            onClick={onToggleCollapse}
            title="关闭面板"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="panel-content">
        {children}
      </div>
    </div>
  )
}

export default Panel
