import React, { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react'
import { OutputLine } from '../../store/types'
import './OutputPanel.css'

interface OutputPanelProps {
  output: OutputLine[]
  isRunning: boolean
  isCompiling: boolean
  onInput: (input: string) => void
  onClear: () => void
  onLineClick?: (line: number) => void
  sampleInput?: string
}

// 单行组件 - 使用 memo 避免不必要的重渲染
const OutputLineItem = memo<{
  line: OutputLine
  onClick?: (lineNumber: number) => void
}>(({ line, onClick }) => {
  const getLineClass = (type: OutputLine['type']) => {
    switch (type) {
      case 'error': return 'output-line-error'
      case 'info': return 'output-line-info'
      case 'input': return 'output-line-input'
      default: return 'output-line-output'
    }
  }

  const handleClick = useCallback(() => {
    if (line.lineNumber && onClick) {
      onClick(line.lineNumber)
    }
  }, [line.lineNumber, onClick])

  return (
    <div
      className={`output-line ${getLineClass(line.type)} ${line.lineNumber ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      {line.lineNumber && (
        <span className="output-line-number">Line {line.lineNumber}:</span>
      )}
      <span className="output-line-content">{line.content}</span>
    </div>
  )
})

OutputLineItem.displayName = 'OutputLineItem'

export const OutputPanel: React.FC<OutputPanelProps> = memo(({
  output,
  isRunning,
  isCompiling,
  onInput,
  onClear,
  onLineClick,
  sampleInput
}) => {
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  const lastOutputLengthRef = useRef(0)

  // 优化：只在新增输出时滚动，使用 requestAnimationFrame
  useEffect(() => {
    if (output.length > lastOutputLengthRef.current && outputRef.current) {
      requestAnimationFrame(() => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
      })
    }
    lastOutputLengthRef.current = output.length
  }, [output.length])

  // Focus input when running
  useEffect(() => {
    if (isRunning && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isRunning])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && isRunning) {
      onInput(inputValue)
      setInputValue('')
    }
  }, [inputValue, isRunning, onInput])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleUseSampleInput = useCallback(() => {
    if (sampleInput && isRunning) {
      // 按行发送示例输入
      const lines = sampleInput.split('\n')
      lines.forEach(line => {
        if (line.trim()) {
          onInput(line)
        }
      })
    }
  }, [sampleInput, isRunning, onInput])

  // 缓存标题
  const title = useMemo(() => {
    if (isCompiling) return '⏳ Compiling...'
    if (isRunning) return '▶ Running'
    return 'Output'
  }, [isCompiling, isRunning])

  // 使用虚拟化渲染大量输出（简化版：只渲染最后 200 行）
  const visibleOutput = useMemo(() => {
    if (output.length <= 200) return output
    return output.slice(-200)
  }, [output])

  return (
    <div className="output-panel">
      <div className="output-header">
        <span className="output-title">{title}</span>
        <button className="output-clear-btn" onClick={onClear} title="Clear Output">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      
      <div className="output-content" ref={outputRef}>
        {output.length === 0 ? (
          <div className="output-empty">
            <span>Press ⌘R to compile and run your code</span>
          </div>
        ) : (
          visibleOutput.map((line, index) => (
            <OutputLineItem
              key={line.timestamp || index}
              line={line}
              onClick={onLineClick}
            />
          ))
        )}
      </div>
      
      {isRunning && (
        <form className="output-input-form" onSubmit={handleSubmit}>
          <span className="output-input-prompt">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            className="output-input"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter input..."
            autoFocus
          />
          {sampleInput && (
            <button
              type="button"
              className="sample-input-btn"
              onClick={handleUseSampleInput}
              title="使用示例输入"
            >
              示例
            </button>
          )}
        </form>
      )}
    </div>
  )
})

OutputPanel.displayName = 'OutputPanel'

export default OutputPanel
