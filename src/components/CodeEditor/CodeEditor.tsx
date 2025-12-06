import { useRef, useEffect, useCallback, memo } from 'react'
import Editor, { OnMount, OnChange, loader } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type Monaco from 'monaco-editor'
import { blueWhiteTheme, darkTheme, THEME_NAME, DARK_THEME_NAME } from './monacoTheme'
import { registerCCompletions } from './cCompletions'
import { useEditorStore } from '../../store/editorStore'
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
}

// 使用 memo 避免不必要的重渲染
export const CodeEditor: React.FC<CodeEditorProps> = memo(({ value, onChange }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const isDarkMode = useEditorStore((state) => state.isDarkMode)
  // 使用 ref 存储最新的 value，避免闪烁
  const valueRef = useRef(value)
  valueRef.current = value

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
        theme={THEME_NAME}
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
          // 滚动性能
          fastScrollSensitivity: 5,
          mouseWheelScrollSensitivity: 1,
          // 减少重绘
          fixedOverflowWidgets: true
        }}
      />
    </div>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数：只有 value 真正改变时才重渲染
  return prevProps.value === nextProps.value
})

export default CodeEditor
