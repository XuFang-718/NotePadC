import { useEffect, useCallback, useState, useRef } from 'react'
import { useEditorStore, extractFilename } from './store/editorStore'
import { Toolbar } from './components/Toolbar'
import { TabBar } from './components/TabBar'
import { CodeEditor } from './components/CodeEditor'
import { Terminal } from './components/Terminal'
import { SplitPane } from './components/SplitPane'
import { ProblemPanel } from './components/ProblemPanel'
import { createInfoLine, errorsToOutputLines } from './utils/compilerParser'
import { ThemeTransition } from './components/ThemeTransition'
import { Problem } from './store/types'
import './styles/App.css'

function App() {
  const {
    tabs,
    activeTabId,
    isCompiling,
    isRunning,
    splitRatio,
    isDarkMode,
    problems,
    selectedProblemId,
    isProblemPanelCollapsed,
    addTab,
    removeTab,
    setActiveTab,
    updateTabContent,
    markTabDirty,
    updateTabFilepath,
    appendOutput,
    clearOutput,
    setCompiling,
    setRunning,
    setSplitRatio,
    toggleDarkMode,
    setDarkMode,
    getActiveTab,
    setProblems,
    selectProblem,
    saveUserCode,
    getUserCode
  } = useEditorStore()

  const activeTab = getActiveTab()
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [showThemeTransition, setShowThemeTransition] = useState(false)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)

  const handleToggleDarkMode = useCallback(async () => {
    setShowThemeTransition(true)
    toggleDarkMode()
    // 保存到配置文件
    if (window.electronAPI) {
      const newDarkMode = !isDarkMode
      await window.electronAPI.setDarkMode(newDarkMode)
    }
  }, [toggleDarkMode, isDarkMode])

  const handleThemeAnimationEnd = useCallback(() => {
    setShowThemeTransition(false)
  }, [])

  // File operations
  const handleNewFile = useCallback(() => {
    addTab({})
  }, [addTab])

  const handleOpenFile = useCallback(async () => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.openFileDialog()
    if (result) {
      const filename = extractFilename(result.filepath)
      addTab({
        filepath: result.filepath,
        filename,
        content: result.content,
        isDirty: false
      })
    }
  }, [addTab])

  const handleSaveFile = useCallback(async () => {
    if (!window.electronAPI || !activeTab) return
    
    if (activeTab.filepath) {
      await window.electronAPI.saveFile(activeTab.filepath, activeTab.content)
      markTabDirty(activeTab.id, false)
    } else {
      const filepath = await window.electronAPI.saveFileDialog(activeTab.content)
      if (filepath) {
        const filename = extractFilename(filepath)
        updateTabFilepath(activeTab.id, filepath, filename)
      }
    }
  }, [activeTab, markTabDirty, updateTabFilepath])

  // Compile and run
  const handleRun = useCallback(async () => {
    if (!window.electronAPI || !activeTab) return
    
    let filepath = activeTab.filepath
    
    // 如果文件没有保存过，自动保存到桌面的 NONAME.c
    if (!filepath) {
      filepath = await window.electronAPI.saveToDesktop(activeTab.content)
      updateTabFilepath(activeTab.id, filepath, 'NONAME.c')
    } else if (activeTab.isDirty) {
      // 如果文件已保存但有修改，保存到原路径
      await window.electronAPI.saveFile(filepath, activeTab.content)
      markTabDirty(activeTab.id, false)
    }
    
    clearOutput()
    setCompiling(true)
    
    try {
      const result = await window.electronAPI.compile(filepath)
      
      if (result.success && result.executablePath) {
        setCompiling(false)
        setRunning(true)
        
        await window.electronAPI.runExecutable(result.executablePath)
      } else {
        setCompiling(false)
        appendOutput(createInfoLine('Compilation failed:'))
        if (result.errors) {
          const errorLines = errorsToOutputLines(result.errors)
          errorLines.forEach(line => appendOutput(line))
        }
      }
    } catch (error) {
      setCompiling(false)
      appendOutput({ type: 'error', content: `Error: ${error}` })
    }
  }, [activeTab, updateTabFilepath, markTabDirty, clearOutput, setCompiling, setRunning, appendOutput])

  const handleStop = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.stopProcess()
    }
    setRunning(false)
  }, [setRunning])

  const handleTabClose = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab?.isDirty) {
      // In a real app, show confirmation dialog
      // For now, just close
    }
    removeTab(tabId)
  }, [tabs, removeTab])

  // Auto save effect
  useEffect(() => {
    if (!autoSaveEnabled || !activeTab || !activeTab.isDirty) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto save (1 second delay)
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!window.electronAPI || !activeTab) return
      
      if (activeTab.filepath) {
        await window.electronAPI.saveFile(activeTab.filepath, activeTab.content)
        markTabDirty(activeTab.id, false)
      }
    }, 1000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [autoSaveEnabled, activeTab?.content, activeTab?.isDirty, activeTab?.filepath, activeTab?.id, markTabDirty])

  // Set up IPC listeners
  useEffect(() => {
    if (!window.electronAPI) return

    // Terminal 组件会处理输出，这里只处理退出状态
    const unsubExit = window.electronAPI.onProcessExit(() => {
      setRunning(false)
    })

    const unsubNewFile = window.electronAPI.onMenuNewFile(handleNewFile)
    const unsubOpenFile = window.electronAPI.onMenuOpenFile(handleOpenFile)
    const unsubSaveFile = window.electronAPI.onMenuSaveFile(handleSaveFile)
    const unsubRun = window.electronAPI.onMenuRun(handleRun)
    const unsubStop = window.electronAPI.onMenuStop(handleStop)
    const unsubAutoSave = window.electronAPI.onMenuAutoSaveToggle((enabled) => {
      setAutoSaveEnabled(enabled)
    })

    return () => {
      unsubExit()
      unsubNewFile()
      unsubOpenFile()
      unsubSaveFile()
      unsubRun()
      unsubStop()
      unsubAutoSave()
    }
  }, [setRunning, handleNewFile, handleOpenFile, handleSaveFile, handleRun, handleStop])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault()
            handleNewFile()
            break
          case 'o':
            e.preventDefault()
            handleOpenFile()
            break
          case 's':
            e.preventDefault()
            handleSaveFile()
            break
          case 'r':
            e.preventDefault()
            if (!isRunning && !isCompiling) {
              handleRun()
            }
            break
          case '.':
            e.preventDefault()
            if (isRunning || isCompiling) {
              handleStop()
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewFile, handleOpenFile, handleSaveFile, handleRun, handleStop, isRunning, isCompiling])

  // Load config and create initial tab on mount
  useEffect(() => {
    const initApp = async () => {
      // 加载配置
      if (window.electronAPI) {
        const config = await window.electronAPI.getConfig()
        // 直接设置暗色模式（不是 toggle）
        setDarkMode(config.isDarkMode)
        // 应用自动保存设置
        setAutoSaveEnabled(config.autoSaveEnabled)
        
        // 加载题目配置
        const problemConfig = await window.electronAPI.loadProblems()
        if (problemConfig?.problems) {
          setProblems(problemConfig.problems)
        }
      }
      
      // 标记配置已加载
      setIsConfigLoaded(true)
      
      // 创建初始标签页
      const currentTabs = useEditorStore.getState().tabs
      if (currentTabs.length === 0) {
        addTab({})
      }
    }
    initApp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // File drop handler
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!window.electronAPI || !e.dataTransfer?.files) return

      const files = Array.from(e.dataTransfer.files)
      for (const file of files) {
        const filepath = (file as any).path
        if (filepath && (filepath.endsWith('.c') || filepath.endsWith('.h'))) {
          try {
            const content = await window.electronAPI.readFile(filepath)
            const filename = extractFilename(filepath)
            addTab({
              filepath,
              filename,
              content,
              isDirty: false
            })
          } catch (error) {
            console.error('Failed to read dropped file:', error)
          }
        }
      }
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [addTab])

  // 开始编程 - 加载题目模板或用户代码
  const handleStartCoding = useCallback(async (problem: Problem) => {
    // 检查是否有用户保存的代码
    let code = getUserCode(problem.id)
    
    if (!code && window.electronAPI) {
      // 尝试从文件加载
      code = await window.electronAPI.loadUserCode(problem.id)
      if (code) {
        saveUserCode(problem.id, code)
      }
    }
    
    // 使用用户代码或模板
    const content = code || problem.template
    
    // 创建新标签页
    addTab({
      filename: `${problem.title}.c`,
      content,
      isDirty: false,
      problemId: problem.id
    })
  }, [getUserCode, saveUserCode, addTab])

  // 保存用户代码到文件
  const handleContentChangeWithSave = useCallback((content: string) => {
    if (activeTabId) {
      updateTabContent(activeTabId, content)
      
      // 如果是题目相关的标签页，保存用户代码
      const tab = tabs.find(t => t.id === activeTabId)
      if (tab?.problemId) {
        saveUserCode(tab.problemId, content)
        // 异步保存到文件
        if (window.electronAPI) {
          window.electronAPI.saveUserCode(tab.problemId, content)
        }
      }
    }
  }, [activeTabId, updateTabContent, tabs, saveUserCode])

  // 配置加载完成前不渲染主界面，避免主题闪烁
  if (!isConfigLoaded) {
    return <div className="app" style={{ backgroundColor: 'var(--bg-primary)' }} />
  }

  return (
    <div className="app">
      <ThemeTransition 
        isDarkMode={isDarkMode} 
        show={showThemeTransition} 
        onAnimationEnd={handleThemeAnimationEnd} 
      />
      <Toolbar
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onRun={handleRun}
        onStop={handleStop}
        onToggleDarkMode={handleToggleDarkMode}
        isRunning={isRunning}
        isCompiling={isCompiling}
        canSave={!!activeTab}
        isDarkMode={isDarkMode}
      />
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={setActiveTab}
        onTabClose={handleTabClose}
      />
      <div className="main-content">
        <ProblemPanel
          problems={problems}
          selectedProblemId={selectedProblemId}
          onSelectProblem={selectProblem}
          onStartCoding={handleStartCoding}
          isCollapsed={isProblemPanelCollapsed}
        />
        <SplitPane
          left={
            <div className="editor-container">
              {activeTab ? (
                <CodeEditor
                  value={activeTab.content}
                  onChange={handleContentChangeWithSave}
                />
              ) : (
                <div className="editor-empty">
                  <p>No file open</p>
                  <p>Press ⌘N to create a new file</p>
                </div>
              )}
            </div>
          }
          right={
            <Terminal
              isRunning={isRunning}
              isCompiling={isCompiling}
              isDarkMode={isDarkMode}
              onClear={clearOutput}
            />
          }
          ratio={splitRatio}
          onResize={setSplitRatio}
        />
      </div>
    </div>
  )
}

export default App
