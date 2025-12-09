import React, { useState, useCallback, useRef } from 'react'
import { Problem } from '../../store/types'
import './Sidebar.css'

// 简化的 SidebarView - 只有 problems
export type SidebarView = 'problems'

interface SidebarProps {
  view: SidebarView
  width: number
  onResize: (width: number) => void
  isCollapsed: boolean
  // Problems props
  problems: Problem[]
  selectedProblemId: string | null
  onSelectProblem: (problemId: string | null) => void
  onStartCoding: (problem: Problem) => void
}

// Icons
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.7 13.7L5 13l4.6-4.6L5 3.7l.7-.7 5.3 5.3-5.3 5.4z"/>
  </svg>
)

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7.4 11.4L2 6l.7-.7L7.4 10l4.6-4.7.7.7-5.3 5.4z"/>
  </svg>
)

const FileIcon = ({ type }: { type: 'c' | 'h' | 'default' }) => {
  const color = type === 'c' ? 'var(--vscode-icon-c-file)' : 
                type === 'h' ? 'var(--vscode-icon-h-file)' : 
                'var(--vscode-foreground)'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.85 4.44l-3.29-3.3A.47.47 0 0010.23 1H3.5a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V4.77a.47.47 0 00-.15-.33zM10.5 2.71L12.29 4.5H10.5V2.71zM12 14H4V2h5.5v3a.5.5 0 00.5.5h2V14z" fill={color}/>
    </svg>
  )
}

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2l10 6-10 6V2z"/>
  </svg>
)

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M10 12L6 8l4-4-.7-.7L4.6 8l4.7 4.7.7-.7z"/>
  </svg>
)

export const Sidebar: React.FC<SidebarProps> = ({
  view,
  width,
  onResize,
  isCollapsed,
  problems,
  selectedProblemId,
  onSelectProblem,
  onStartCoding
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    problems: true
  })
  const sidebarRef = useRef<HTMLDivElement>(null)

  const selectedProblem = problems.find(p => p.id === selectedProblemId)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const startX = e.clientX
    const startWidth = width

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      const newWidth = Math.max(170, Math.min(500, startWidth + delta))
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

  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', label: 'Easy' }
      case 'medium': return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', label: 'Medium' }
      case 'hard': return { color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', label: 'Hard' }
      default: return { color: 'var(--vscode-foreground)', bg: 'var(--vscode-sideBar-background)', label: difficulty }
    }
  }

  return (
    <div 
      className="sidebar" 
      ref={sidebarRef}
      style={{ width }}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">题目管理器</span>
      </div>

      {/* Sidebar Content - 只显示题目管理器 */}
      <div className="sidebar-content">
        {!selectedProblem && (
          <ProblemsListView
            problems={problems}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            onSelectProblem={onSelectProblem}
            getDifficultyInfo={getDifficultyInfo}
          />
        )}
        
        {selectedProblem && (
          <ProblemDetailView
            problem={selectedProblem}
            onBack={() => onSelectProblem(null)}
            onStart={() => onStartCoding(selectedProblem)}
            getDifficultyInfo={getDifficultyInfo}
          />
        )}
      </div>

      {/* Resize Handle */}
      <div 
        className={`sidebar-resize-handle ${isDragging ? 'active' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}


// Explorer View Component
function ExplorerView() {
  const [expanded, setExpanded] = useState(true)
  
  return (
    <div className="explorer-view">
      <div 
        className="section-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="section-chevron">
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </span>
        <span className="section-title">NOTEPADC</span>
      </div>
      {expanded && (
        <div className="section-content">
          <div className="tree-item" style={{ paddingLeft: 24 }}>
            <FileIcon type="c" />
            <span className="tree-item-label">main.c</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Problems List View Component
interface ProblemsListViewProps {
  problems: Problem[]
  expandedSections: Record<string, boolean>
  toggleSection: (section: string) => void
  onSelectProblem: (id: string) => void
  getDifficultyInfo: (d: string) => { color: string; bg: string; label: string }
}

function ProblemsListView({ 
  problems, 
  expandedSections, 
  toggleSection, 
  onSelectProblem,
  getDifficultyInfo 
}: ProblemsListViewProps) {
  const isExpanded = expandedSections.problems !== false

  return (
    <div className="problems-list-view">
      <div 
        className="section-header"
        onClick={() => toggleSection('problems')}
      >
        <span className="section-chevron">
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </span>
        <span className="section-title">题目列表</span>
        <span className="section-badge">{problems.length}</span>
      </div>
      
      {isExpanded && (
        <div className="section-content">
          {problems.map((problem) => {
            const diff = getDifficultyInfo(problem.difficulty)
            
            return (
              <div 
                key={problem.id}
                className="tree-item problem-item"
                onClick={() => onSelectProblem(problem.id)}
              >
                <FileIcon type="c" />
                <span className="tree-item-label">{problem.title}</span>
                <span 
                  className="difficulty-badge"
                  style={{ color: diff.color, background: diff.bg }}
                >
                  {diff.label[0]}
                </span>
              </div>
            )
          })}
          
          {problems.length === 0 && (
            <div className="empty-message">No problems available</div>
          )}
        </div>
      )}
    </div>
  )
}

// Problem Detail View Component
interface ProblemDetailViewProps {
  problem: Problem
  onBack: () => void
  onStart: () => void
  getDifficultyInfo: (d: string) => { color: string; bg: string; label: string }
}

function ProblemDetailView({ problem, onBack, onStart, getDifficultyInfo }: ProblemDetailViewProps) {
  const diff = getDifficultyInfo(problem.difficulty)
  
  return (
    <div className="problem-detail-view">
      {/* Back button */}
      <div className="detail-back">
        <button className="back-button" onClick={onBack}>
          <BackIcon />
          <span>Back</span>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="detail-scroll">
        {/* Title and difficulty */}
        <div className="detail-header-row">
          <h2 className="detail-title">{problem.title}</h2>
          <span 
            className="detail-badge"
            style={{ color: diff.color, background: diff.bg }}
          >
            {diff.label}
          </span>
        </div>

        {/* Description */}
        <div className="detail-section">
          <div className="detail-label">DESCRIPTION</div>
          <div className="detail-text">{problem.description}</div>
        </div>

        {/* Input Format */}
        {problem.inputFormat && (
          <div className="detail-section">
            <div className="detail-label">INPUT</div>
            <div className="detail-text">{problem.inputFormat}</div>
          </div>
        )}

        {/* Output Format */}
        {problem.outputFormat && (
          <div className="detail-section">
            <div className="detail-label">OUTPUT</div>
            <div className="detail-text">{problem.outputFormat}</div>
          </div>
        )}

        {/* Examples */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="detail-section">
            <div className="detail-label">EXAMPLES</div>
            {problem.examples.map((ex, i) => (
              <div key={i} className="example-box">
                {ex.input && (
                  <div className="example-item">
                    <span className="example-label">Input</span>
                    <pre className="example-code">{ex.input}</pre>
                  </div>
                )}
                <div className="example-item">
                  <span className="example-label">Output</span>
                  <pre className="example-code">{ex.output}</pre>
                </div>
                {ex.explanation && (
                  <div className="example-note">{ex.explanation}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {problem.constraints && problem.constraints.length > 0 && (
          <div className="detail-section">
            <div className="detail-label">CONSTRAINTS</div>
            <ul className="detail-list">
              {problem.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Hints */}
        {problem.hints && problem.hints.length > 0 && (
          <div className="detail-section">
            <div className="detail-label">HINTS</div>
            <ul className="detail-list hints">
              {problem.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Start button */}
      <div className="detail-footer">
        <button className="start-button" onClick={onStart}>
          <PlayIcon />
          <span>Start Coding</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
