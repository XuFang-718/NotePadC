import { useRef, useEffect, useCallback, memo, useState } from 'react'
import Editor, { OnMount, OnChange, loader } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type Monaco from 'monaco-editor'
import { blueWhiteTheme, darkTheme, THEME_NAME, DARK_THEME_NAME } from './monacoTheme'
import { registerCCompletions } from './cCompletions'
import { useEditorStore } from '../../store/editorStore'
import { SearchBox } from './SearchBox'
import './CodeEditor.css'

// 预加载 Monaco 编辑器 - 提前初始化
loader.init().then(() => {
  console.log('Monaco pre-initialized')
})

// 标记是否已注册补全
let completionsRegistered = false
let monacoInstance: typeof Monaco | null = null

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onCursorChange?: (line: number, column: number) => void
}

// 使用 memo 避免不必要的重渲染
export const CodeEditor: React.FC<CodeEditorProps> = memo(({ value, onChange, onCursorChange }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const isDarkMode = useEditorStore((state) => state.isDarkMode)
  const [showSearch, setShowSearch] = useState(false)
  // 使用 ref 存储最新的 value，避免闪烁
  const valueRef = useRef(value)
  valueRef.current = value
  
  // 使用 ref 存储最新的 onCursorChange 回调，避免闭包问题
  const onCursorChangeRef = useRef(onCursorChange)
  onCursorChangeRef.current = onCursorChange

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoInstance = monaco
    
    // Register both themes
    monaco.editor.defineTheme(THEME_NAME, blueWhiteTheme)
    monaco.editor.defineTheme(DARK_THEME_NAME, darkTheme)
    monaco.editor.setTheme(isDarkMode ? DARK_THEME_NAME : THEME_NAME)
    
    // Register C completions (only once)
    if (!completionsRegistered) {
      registerCCompletions(monaco)
      completionsRegistered = true
    }
    
    // 性能优化：设置模型选项
    const model = editor.getModel()
    if (model) {
      // 大文件优化：禁用某些昂贵的功能
      model.updateOptions({
        tabSize: 4,
        insertSpaces: true,
        trimAutoWhitespace: true
      })
    }
    
    // 添加 Cmd+F 快捷键打开搜索框
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowSearch(true)
    })
    

    
    // 监听光标位置变化 - 使用 ref 获取最新的回调
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChangeRef.current) {
        onCursorChangeRef.current(e.position.lineNumber, e.position.column)
      }
    })
    
    // 初始化光标位置
    const position = editor.getPosition()
    if (position && onCursorChangeRef.current) {
      onCursorChangeRef.current(position.lineNumber, position.column)
    }
    
    // Focus editor
    editor.focus()
  }, [isDarkMode])

  // 监听暗色模式变化
  useEffect(() => {
    if (monacoInstance) {
      monacoInstance.editor.setTheme(isDarkMode ? DARK_THEME_NAME : THEME_NAME)
    }
  }, [isDarkMode])

  // 使用 useCallback 优化 onChange 处理
  const handleChange: OnChange = useCallback((value) => {
    onChange(value || '')
  }, [onChange])

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        language="c"
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme={isDarkMode ? DARK_THEME_NAME : THEME_NAME}
        loading={<div className="editor-loading">Loading editor...</div>}
        options={{
          fontSize: 14,
          fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace",
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'off',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 0, bottom: 0 },
          lineNumbersMinChars: 4,
          folding: true,
          foldingHighlight: true,
          bracketPairColorization: { enabled: true },
          guides: {
            indentation: true,
            bracketPairs: true
          },
          // 性能优化选项
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          wordBasedSuggestions: 'currentDocument',
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          // 大文件性能优化
          largeFileOptimizations: true,
          maxTokenizationLineLength: 20000,
          // 渲染优化
          renderWhitespace: 'none',
          renderControlCharacters: false,
          renderIndentGuides: true,
          // 禁用不必要的功能
          codeLens: false,
          // @ts-expect-error Monaco types mismatch
          lightbulb: { enabled: false },
          hover: { delay: 300 },
          // 禁用内置搜索框
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'never'
          },
          // 滚动性能
          fastScrollSensitivity: 5,
          mouseWheelScrollSensitivity: 1,
          // 减少重绘
          fixedOverflowWidgets: true
        }}
      />
      {showSearch && (
        <SearchBox
          editor={editorRef.current}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数：只比较 value（onCursorChange 通过 ref 处理）
  return prevProps.value === nextProps.value
})

export default CodeEditor
