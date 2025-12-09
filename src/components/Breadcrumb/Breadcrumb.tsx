import React from 'react'
import './Breadcrumb.css'

interface BreadcrumbProps {
  filepath: string | null
  filename: string
}

// Chevron separator icon
const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="breadcrumb-separator">
    <path d="M5.7 13.7L5 13l4.6-4.6L5 3.7l.7-.7 5.3 5.3-5.3 5.4z"/>
  </svg>
)

// File icon
const FileIcon = ({ filename }: { filename: string }) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const color = ext === 'c' ? 'var(--vscode-icon-c-file)' : 
                ext === 'h' ? 'var(--vscode-icon-h-file)' : 
                'var(--vscode-foreground)'
  
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="breadcrumb-file-icon">
      <path d="M13.85 4.44l-3.29-3.3A.47.47 0 0010.23 1H3.5a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V4.77a.47.47 0 00-.15-.33zM10.5 2.71L12.29 4.5H10.5V2.71zM12 14H4V2h5.5v3a.5.5 0 00.5.5h2V14z" fill={color}/>
    </svg>
  )
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  filepath,
  filename
}) => {
  // Parse filepath into segments
  const getPathSegments = (): string[] => {
    if (!filepath) return []
    
    // Get directory path without filename
    const parts = filepath.split('/')
    parts.pop() // Remove filename
    
    // Return last 2-3 directory segments for brevity
    const relevantParts = parts.slice(-3).filter(Boolean)
    return relevantParts
  }

  const segments = getPathSegments()

  return (
    <div className="breadcrumb">
      <div className="breadcrumb-content">
        {segments.map((segment, index) => (
          <React.Fragment key={index}>
            <span className="breadcrumb-item breadcrumb-folder">
              {segment}
            </span>
            <ChevronIcon />
          </React.Fragment>
        ))}
        <span className="breadcrumb-item breadcrumb-file">
          <FileIcon filename={filename} />
          <span className="breadcrumb-filename">{filename}</span>
        </span>
      </div>
    </div>
  )
}

export default Breadcrumb
