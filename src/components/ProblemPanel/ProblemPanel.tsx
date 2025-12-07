import { useState } from 'react'
import { Problem } from '../../store/types'
import './ProblemPanel.css'

interface ProblemPanelProps {
  problems: Problem[]
  selectedProblemId: string | null
  onSelectProblem: (problemId: string) => void
  onStartCoding: (problem: Problem) => void
  isCollapsed: boolean
}

type TabView = 'list' | 'detail'

export function ProblemPanel({
  problems,
  selectedProblemId,
  onSelectProblem,
  onStartCoding,
  isCollapsed
}: ProblemPanelProps) {
  const [activeTab, setActiveTab] = useState<TabView>('list')
  const selectedProblem = problems.find(p => p.id === selectedProblemId)

  const handleProblemClick = (problemId: string) => {
    onSelectProblem(problemId)
    setActiveTab('detail')
  }

  return (
    <div className={`problem-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="problem-panel-header">
        <h3>题目列表</h3>
      </div>

      {!isCollapsed && (
        <>
          <div className="problem-tabs">
            <button
              className={`problem-tab ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              题目
            </button>
            <button
              className={`problem-tab ${activeTab === 'detail' ? 'active' : ''}`}
              onClick={() => setActiveTab('detail')}
              disabled={!selectedProblem}
            >
              详情
            </button>
          </div>

          {activeTab === 'list' ? (
            <ProblemList
              problems={problems}
              selectedProblemId={selectedProblemId}
              onSelectProblem={handleProblemClick}
            />
          ) : selectedProblem ? (
            <ProblemDetail
              problem={selectedProblem}
              onStartCoding={() => onStartCoding(selectedProblem)}
            />
          ) : (
            <div className="problem-list">
              <p style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                请先选择一道题目
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ProblemList sub-component
interface ProblemListProps {
  problems: Problem[]
  selectedProblemId: string | null
  onSelectProblem: (problemId: string) => void
}

function ProblemList({ problems, selectedProblemId, onSelectProblem }: ProblemListProps) {
  return (
    <div className="problem-list">
      {problems.map((problem, index) => (
        <div
          key={problem.id}
          className={`problem-item ${selectedProblemId === problem.id ? 'selected' : ''}`}
          onClick={() => onSelectProblem(problem.id)}
        >
          <span className="problem-item-number">{index + 1}</span>
          <span className="problem-item-title">{problem.title}</span>
          <span className={`difficulty-badge ${problem.difficulty}`}>
            {problem.difficulty === 'easy' ? '简单' : problem.difficulty === 'medium' ? '中等' : '困难'}
          </span>
        </div>
      ))}
      {problems.length === 0 && (
        <p style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          暂无题目
        </p>
      )}
    </div>
  )
}

// ProblemDetail sub-component
interface ProblemDetailProps {
  problem: Problem
  onStartCoding: () => void
}

function ProblemDetail({ problem, onStartCoding }: ProblemDetailProps) {
  return (
    <div className="problem-detail">
      <div className="problem-detail-header">
        <h2 className="problem-detail-title">{problem.title}</h2>
        <span className={`difficulty-badge ${problem.difficulty}`}>
          {problem.difficulty === 'easy' ? '简单' : problem.difficulty === 'medium' ? '中等' : '困难'}
        </span>
      </div>

      <div className="problem-description">{problem.description}</div>

      {problem.inputFormat && (
        <div className="problem-section">
          <div className="problem-section-title">输入格式</div>
          <div className="problem-section-content">{problem.inputFormat}</div>
        </div>
      )}

      {problem.outputFormat && (
        <div className="problem-section">
          <div className="problem-section-title">输出格式</div>
          <div className="problem-section-content">{problem.outputFormat}</div>
        </div>
      )}

      {problem.examples.length > 0 && (
        <div className="problem-section">
          <div className="problem-section-title">示例</div>
          {problem.examples.map((example, index) => (
            <div key={index} className="example-box">
              {example.input && (
                <>
                  <div className="example-label">输入</div>
                  <div className="example-content">{example.input || '(无输入)'}</div>
                </>
              )}
              <div className="example-label" style={{ marginTop: example.input ? '8px' : 0 }}>输出</div>
              <div className="example-content">{example.output}</div>
              {example.explanation && (
                <div className="example-explanation">{example.explanation}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {problem.constraints && problem.constraints.length > 0 && (
        <div className="problem-section">
          <div className="problem-section-title">约束条件</div>
          <ul className="constraint-list">
            {problem.constraints.map((constraint, index) => (
              <li key={index}>{constraint}</li>
            ))}
          </ul>
        </div>
      )}

      {problem.hints && problem.hints.length > 0 && (
        <div className="problem-section">
          <div className="problem-section-title">提示</div>
          <ul className="hint-list">
            {problem.hints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      <button className="start-coding-btn" onClick={onStartCoding}>
        开始编程
      </button>
    </div>
  )
}

export default ProblemPanel
