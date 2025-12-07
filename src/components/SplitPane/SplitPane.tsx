import React, { useRef, useCallback, useEffect, useState } from 'react'
import './SplitPane.css'

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  ratio: number
  minLeftWidth?: number
  minRightWidth?: number
  onResize: (ratio: number) => void
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  ratio,
  minLeftWidth = 300,
  minRightWidth = 250,
  onResize
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const totalWidth = rect.width
    
    let newRatio = x / totalWidth
    
    // Enforce minimum widths
    const minLeftRatio = minLeftWidth / totalWidth
    const maxLeftRatio = (totalWidth - minRightWidth) / totalWidth
    
    newRatio = Math.max(minLeftRatio, Math.min(maxLeftRatio, newRatio))
    
    // Clamp to 0.2 - 0.8 range
    newRatio = Math.max(0.2, Math.min(0.8, newRatio))
    
    onResize(newRatio)
  }, [isDragging, minLeftWidth, minRightWidth, onResize])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const leftWidth = `${ratio * 100}%`
  const rightWidth = `${(1 - ratio) * 100}%`

  return (
    <div className="split-pane" ref={containerRef}>
      <div className="split-pane-left" style={{ width: leftWidth }}>
        {left}
      </div>
      <div 
        className={`split-pane-divider ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="split-pane-divider-handle" />
      </div>
      <div className="split-pane-right" style={{ width: rightWidth }}>
        {right}
      </div>
    </div>
  )
}

export default SplitPane
