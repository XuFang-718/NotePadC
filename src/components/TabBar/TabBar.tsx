import React from 'react'
import { Tab } from '../../store/types'
import './TabBar.css'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose
}) => {
  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    onTabClose(tabId)
  }

  if (tabs.length === 0) {
    return <div className="tab-bar tab-bar-empty" />
  }

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'tab-active' : ''}`}
            onClick={() => onTabSelect(tab.id)}
          >
            <span className="tab-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 2h6l4 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              </svg>
            </span>
            <span className="tab-name">
              {tab.isDirty && <span className="tab-dirty">●</span>}
              {tab.filename}
            </span>
            <button
              className="tab-close"
              onClick={(e) => handleClose(e, tab.id)}
              title="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TabBar
