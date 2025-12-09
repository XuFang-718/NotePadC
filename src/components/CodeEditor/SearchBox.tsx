import { useState, useEffect, useCallback, useRef } from 'react'
import type { editor } from 'monaco-editor'

interface SearchBoxProps {
  editor: editor.IStandaloneCodeEditor | null
  onClose: () => void
}

export const SearchBox: React.FC<SearchBoxProps> = ({ editor, onClose }) => {
  const [searchText, setSearchText] = useState('')
  const [currentMatch, setCurrentMatch] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const decorationsRef = useRef<string[]>([])

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 执行搜索
  const performSearch = useCallback(() => {
    if (!editor || !searchText) {
      // 清除高亮
      if (decorationsRef.current.length > 0) {
        editor?.deltaDecorations(decorationsRef.current, [])
        decorationsRef.current = []
      }
      setTotalMatches(0)
      setCurrentMatch(0)
      return
    }

    const model = editor.getModel()
    if (!model) return

    // 查找所有匹配项
    const matches = model.findMatches(
      searchText,
      true,
      false,
      true,
      null,
      true
    )

    setTotalMatches(matches.length)

    if (matches.length === 0) {
      setCurrentMatch(0)
      return
    }

    // 高亮所有匹配项
    const newDecorations = matches.map((match) => ({
      range: match.range,
      options: {
        className: 'search-highlight',
        isWholeLine: false,
        inlineClassName: 'search-highlight-inline'
      }
    }))

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    )

    // 跳转到第一个匹配项
    if (matches.length > 0) {
      setCurrentMatch(1)
      editor.revealRangeInCenter(matches[0].range)
      editor.setSelection(matches[0].range)
    }
  }, [editor, searchText])

  // 搜索文本变化时执行搜索
  useEffect(() => {
    performSearch()
  }, [performSearch])

  // 下一个匹配项
  const findNext = useCallback(() => {
    if (!editor || totalMatches === 0) return

    const model = editor.getModel()
    if (!model) return

    const matches = model.findMatches(
      searchText,
      true,
      false,
      true,
      null,
      true
    )

    if (matches.length === 0) return

    const nextIndex = currentMatch % matches.length
    setCurrentMatch(nextIndex + 1)

    editor.revealRangeInCenter(matches[nextIndex].range)
    editor.setSelection(matches[nextIndex].range)
  }, [editor, searchText, currentMatch, totalMatches])

  // 上一个匹配项
  const findPrevious = useCallback(() => {
    if (!editor || totalMatches === 0) return

    const model = editor.getModel()
    if (!model) return

    const matches = model.findMatches(
      searchText,
      true,
      false,
      true,
      null,
      true
    )

    if (matches.length === 0) return

    const prevIndex = currentMatch - 2 < 0 ? matches.length - 1 : currentMatch - 2
    setCurrentMatch(prevIndex + 1)

    editor.revealRangeInCenter(matches[prevIndex].range)
    editor.setSelection(matches[prevIndex].range)
  }, [editor, searchText, currentMatch, totalMatches])

  // 键盘快捷键
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          findPrevious()
        } else {
          findNext()
        }
        e.preventDefault()
      }
    },
    [onClose, findNext, findPrevious]
  )

  // 清理装饰器
  useEffect(() => {
    return () => {
      if (editor && decorationsRef.current.length > 0) {
        editor.deltaDecorations(decorationsRef.current, [])
      }
    }
  }, [editor])

  return (
    <div className="custom-search-box">
      <div className="search-header">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="查找..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="search-controls">
          <button
            className="search-btn"
            onClick={findPrevious}
            disabled={totalMatches === 0}
            title="上一个 (Shift+Enter)"
          >
            ↑
          </button>
          <button
            className="search-btn"
            onClick={findNext}
            disabled={totalMatches === 0}
            title="下一个 (Enter)"
          >
            ↓
          </button>
        </div>
        <button className="close-btn" onClick={onClose} title="关闭 (Esc)">
          ×
        </button>
      </div>
      {searchText && (
        <div className="search-info">
          {totalMatches > 0
            ? `${currentMatch} / ${totalMatches} 个匹配项`
            : '未找到匹配项'}
        </div>
      )}
    </div>
  )
}
