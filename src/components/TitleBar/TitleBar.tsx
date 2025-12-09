import React from 'react'
import './TitleBar.css'

interface TitleBarProps {
  title?: string
}

export const TitleBar: React.FC<TitleBarProps> = ({ 
  title = 'NotePadC' 
}) => {
  return (
    <div className="titlebar">
      <div className="titlebar-drag-region" />
      <div className="titlebar-title">
        <span className="titlebar-title-text">{title}</span>
      </div>
      <div className="titlebar-controls">
        {/* macOS uses native window controls, this is just for visual consistency */}
      </div>
    </div>
  )
}

export default TitleBar
