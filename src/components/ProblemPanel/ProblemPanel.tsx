import { useState, useRef, useCallback, memo } from 'react'
import { Problem } from '../../store/types'
import './ProblemPanel.css'

interface ProblemPanelProps {
  problems: Problem[]
  selectedProblemId: string | null
  onSelectProblem: (problemId: string | null) => void
  onStartCoding: (problem: Problem) => void
  isCollapsed: boolean
}

// Icons
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2l10 6-10 6V2z"/>
  </svg>
)

export const ProblemPanel = memo(function ProblemPanel({
  problems,
  selectedProblemId,
  onSelectProblem,
  onStartCoding,
  isCollapsed
}: ProblemPanelProps) {
  const [panelWidth, setPanelWidth] = useState(260)
  const [isDragging, setIsDragging] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const selectedProblem = problems.find(p => p.id === selectedProblemId)

  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', label: 'Easy' }
      case 'medium': return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', label: 'Medium' }
      case 'hard': return { color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', label: 'Hard' }
      default: return { color: 'var(--text-secondary)', bg: 'var(--bg-secondary)', label: difficulty }
    }
  }

  // Drag handlers for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const startX = e.clientX
    const startWidth = panelWidth

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      const newWidth = Math.max(200, Math.min(450, startWidth + delta))
      setPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [panelWidth])

  if (isCollapsed) {
    return <div className="problem-panel collapsed" />
  }

  return (
    <div 
      className="problem-panel" 
      ref={panelRef}
      style={{ width: panelWidth }}
    >
      {/* Content Area */}
      <div className="panel-content">
        {selectedProblem ? (
          // Detail View
          <DetailView 
            problem={selectedProblem}
            onBack={() => onSelectProblem(null)}
            onStart={() => onStartCoding(selectedProblem)}
            getDifficultyInfo={getDifficultyInfo}
          />
        ) : (
          // List View
          <ListView 
            problems={problems}
            onSelect={onSelectProblem}
            getDifficultyInfo={getDifficultyInfo}
          />
        )}
      </div>

      {/* Resize Handle */}
      <div 
        className={`resize-handle ${isDragging ? 'active' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
})

// List View Component
interface ListViewProps {
  problems: Problem[]
  onSelect: (id: string) => void
  getDifficultyInfo: (d: string) => { color: string; bg: string; label: string }
}

function ListView({ problems, onSelect, getDifficultyInfo }: ListViewProps) {
  return (
    <div className="list-view">
      <div className="list-header">
        <span className="header-title">Problems</span>
        <span className="header-count">{problems.length}</span>
      </div>
      
      <div className="list-items">
        {problems.map((problem, index) => {
          const diff = getDifficultyInfo(problem.difficulty)
          const num = String(index + 1).padStart(3, '0')
          
          return (
            <div 
              key={problem.id}
              className="list-item"
              onClick={() => onSelect(problem.id)}
            >
              <span className="item-title">{num}-{problem.title}</span>
              <span 
                className="item-badge"
                style={{ color: diff.color, background: diff.bg }}
              >
                {diff.label[0]}
              </span>
            </div>
          )
        })}
        
        {problems.length === 0 && (
          <div className="empty-state">No problems available</div>
        )}
      </div>
    </div>
  )
}

// Detail View Component
interface DetailViewProps {
  problem: Problem
  onBack: () => void
  onStart: () => void
  getDifficultyInfo: (d: string) => { color: string; bg: string; label: string }
}

function DetailView({ problem, onBack, onStart, getDifficultyInfo }: DetailViewProps) {
  const diff = getDifficultyInfo(problem.difficulty)
  
  return (
    <div className="detail-view">
      {/* Header with back button */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          <BackIcon />
          <span>Back</span>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="detail-content">
        {/* Title and difficulty */}
        <div className="detail-title-row">
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
          <div className="section-label">Description</div>
          <div className="section-text">{problem.description}</div>
        </div>

        {/* Input Format */}
        {problem.inputFormat && (
          <div className="detail-section">
            <div className="section-label">Input</div>
            <div className="section-text">{problem.inputFormat}</div>
          </div>
        )}

        {/* Output Format */}
        {problem.outputFormat && (
          <div className="detail-section">
            <div className="section-label">Output</div>
            <div className="section-text">{problem.outputFormat}</div>
          </div>
        )}

        {/* Examples */}
        {problem.examples.length > 0 && (
          <div className="detail-section">
            <div className="section-label">Examples</div>
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
            <div className="section-label">Constraints</div>
            <ul className="constraint-list">
              {problem.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Hints */}
        {problem.hints && problem.hints.length > 0 && (
          <div className="detail-section">
            <div className="section-label">Hints</div>
            <ul className="hint-list">
              {problem.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Start button - fixed at bottom */}
      <div className="detail-footer">
        <button className="start-btn" onClick={onStart}>
          <PlayIcon />
          <span>Start Coding</span>
        </button>
      </div>
    </div>
  )
}

export default ProblemPanel
