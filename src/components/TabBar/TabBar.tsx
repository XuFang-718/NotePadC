import React from 'react'
import { Tab } from '../../store/types'
import './TabBar.css'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
}

// File icon component
const FileIcon = ({ filename }: { filename: string }) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const color = ext === 'c' ? 'var(--vscode-icon-c-file)' : 
                ext === 'h' ? 'var(--vscode-icon-h-file)' : 
                'var(--vscode-foreground)'
  
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="tab-file-icon">
      <path d="M13.85 4.44l-3.29-3.3A.47.47 0 0010.23 1H3.5a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V4.77a.47.47 0 00-.15-.33zM10.5 2.71L12.29 4.5H10.5V2.71zM12 14H4V2h5.5v3a.5.5 0 00.5.5h2V14z" fill={color}/>
    </svg>
  )
}

// Close icon
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z"/>
  </svg>
)

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
    return <div className="tabbar tabbar-empty" />
  }

  return (
    <div className="tabbar">
      <div className="tabbar-tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          
          return (
            <div
              key={tab.id}
              className={`tab ${isActive ? 'tab-active' : 'tab-inactive'}`}
              onClick={() => onTabSelect(tab.id)}
            >
              <FileIcon filename={tab.filename} />
              <span className="tab-label">
                {tab.filename}
              </span>
              <div className="tab-actions">
                {tab.isDirty && (
                  <span className="tab-dirty-indicator" title="Unsaved changes">*</span>
                )}
                <button
                  className="tab-close-btn"
                  onClick={(e) => handleClose(e, tab.id)}
                  title="Close"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TabBar
