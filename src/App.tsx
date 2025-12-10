import { useEffect, useCallback, useState, useRef } from 'react'
import { useEditorStore, extractFilename } from './store/editorStore'
import { TitleBar } from './components/TitleBar'
import { ActivityBar, ActivityView } from './components/ActivityBar'
import { Sidebar, SidebarView } from './components/Sidebar'
import { TabBar } from './components/TabBar'
import { Breadcrumb } from './components/Breadcrumb'
import { CodeEditor } from './components/CodeEditor'
import { Terminal } from './components/Terminal'
import { Panel, PanelTab } from './components/Panel'
import { StatusBar } from './components/StatusBar'
import type { StatusBarRef } from './components/StatusBar/StatusBar'
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
    isDarkMode,
    problems,
    selectedProblemId,
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
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const statusBarRef = useRef<StatusBarRef>(null)

  // Modern layout state - 水平三栏布局
  const [activeView, setActiveView] = useState<ActivityView>('problems')
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [terminalWidth, setTerminalWidth] = useState(320) // 终端宽度替代高度
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false)
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>('terminal')
  const [clearTrigger, setClearTrigger] = useState(0) // 用于触发终端清除

  const handleThemeAnimationEnd = useCallback(() => {
    setShowThemeTransition(false)
  }, [])

  // 响应式布局 - 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      // 窗口 < 800px 时自动折叠侧边栏
      if (width < 800 && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true)
      }
      // 窗口 < 600px 时折叠终端
      if (width < 600 && !isTerminalCollapsed) {
        setIsTerminalCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    // 初始检查
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [isSidebarCollapsed, isTerminalCollapsed])

  // Activity bar view change
  const handleViewChange = useCallback((view: ActivityView) => {
    if (view === activeView && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true)
    } else {
      setActiveView(view)
      setIsSidebarCollapsed(false)
    }
  }, [activeView, isSidebarCollapsed])

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
    
    if (!filepath) {
      filepath = await window.electronAPI.saveToDesktop(activeTab.content)
      updateTabFilepath(activeTab.id, filepath, 'NONAME.c')
    } else if (activeTab.isDirty) {
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
    removeTab(tabId)
  }, [removeTab])


  // Auto save effect
  useEffect(() => {
    if (!autoSaveEnabled || !activeTab || !activeTab.isDirty) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

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
    
    const unsubToggleProblems = window.electronAPI.onMenuToggleProblems((show) => {
      setIsSidebarCollapsed(!show)
    })
    
    const unsubToggleTimer = window.electronAPI.onMenuToggleTimer(() => {
      if (statusBarRef.current) {
        statusBarRef.current.toggleTimer()
      }
    })
    
    const unsubPauseTimer = window.electronAPI.onMenuPauseTimer(() => {
      if (statusBarRef.current) {
        // 运行中 -> 暂停，暂停中 -> 继续
        if (statusBarRef.current.isRunning()) {
          statusBarRef.current.pauseTimer()
        } else if (statusBarRef.current.isPaused()) {
          statusBarRef.current.startTimer()
        }
      }
    })

    return () => {
      unsubExit()
      unsubNewFile()
      unsubOpenFile()
      unsubSaveFile()
      unsubRun()
      unsubStop()
      unsubAutoSave()
      unsubToggleProblems()
      unsubToggleTimer()
      unsubPauseTimer()
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
          case 'b':
            e.preventDefault()
            setIsSidebarCollapsed(prev => !prev)
            break
          case 'j':
            e.preventDefault()
            setIsTerminalCollapsed(prev => !prev)
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
      if (window.electronAPI) {
        const config = await window.electronAPI.getConfig()
        setDarkMode(config.isDarkMode)
        setAutoSaveEnabled(config.autoSaveEnabled)
        
        const problemConfig = await window.electronAPI.loadProblems()
        if (problemConfig?.problems) {
          setProblems(problemConfig.problems)
        }
      }
      
      setIsConfigLoaded(true)
      
      const currentTabs = useEditorStore.getState().tabs
      if (currentTabs.length === 0) {
        addTab({})
      }
    }
    initApp()
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

  // Start coding handler
  const handleStartCoding = useCallback(async (problem: Problem) => {
    let code = getUserCode(problem.id)
    
    if (!code && window.electronAPI) {
      code = await window.electronAPI.loadUserCode(problem.id)
      if (code) {
        saveUserCode(problem.id, code)
      }
    }
    
    const content = code || problem.template
    
    addTab({
      filename: `${problem.title}.c`,
      content,
      isDirty: false,
      problemId: problem.id
    })
    
    if (statusBarRef.current) {
      statusBarRef.current.startTimer()
    }
  }, [getUserCode, saveUserCode, addTab])

  // Content change handler
  const handleContentChangeWithSave = useCallback((content: string) => {
    if (activeTabId) {
      updateTabContent(activeTabId, content)
      
      const tab = tabs.find(t => t.id === activeTabId)
      if (tab?.problemId) {
        saveUserCode(tab.problemId, content)
        if (window.electronAPI) {
          window.electronAPI.saveUserCode(tab.problemId, content)
        }
      }
    }
  }, [activeTabId, updateTabContent, tabs, saveUserCode])

  // Cursor change handler
  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorPosition({ line, column })
  }, [])

  // Timer end handler
  const handleTimerEnd = useCallback((elapsedTime: number) => {
    const totalSeconds = Math.floor(elapsedTime / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const timeStr = minutes > 0 
      ? `${minutes}分${seconds}秒` 
      : `${seconds}秒`
    
    appendOutput({ 
      type: 'info', 
      content: `⏱ 编程用时: ${timeStr}` 
    })
  }, [appendOutput])

  // Loading state
  if (!isConfigLoaded) {
    return <div className="app" style={{ backgroundColor: '#0D0D0D' }} />
  }

  // 简化的 sidebar view - 只有 problems
  const sidebarView: SidebarView = 'problems'

  return (
    <div className="app">
      <ThemeTransition 
        isDarkMode={isDarkMode} 
        show={showThemeTransition} 
        onAnimationEnd={handleThemeAnimationEnd} 
      />
      
      {/* Title Bar */}
      <TitleBar title={activeTab?.filename || 'NotePadC'} />
      
      {/* Main Layout */}
      <div className="main-layout">
        {/* Activity Bar */}
        <ActivityBar
          activeView={activeView}
          onViewChange={handleViewChange}
          problemCount={problems.length}
        />
        
        {/* Sidebar */}
        <Sidebar
          view={sidebarView}
          width={sidebarWidth}
          onResize={setSidebarWidth}
          isCollapsed={isSidebarCollapsed}
          problems={problems}
          selectedProblemId={selectedProblemId}
          onSelectProblem={selectProblem}
          onStartCoding={handleStartCoding}
        />
        
        {/* Workbench (Editor + Terminal 水平布局) */}
        <div className="workbench">
          {/* Editor Area - 圆角容器 */}
          <div className="editor-area">
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onTabSelect={setActiveTab}
              onTabClose={handleTabClose}
            />
            
            <div className="editor-container">
              {activeTab ? (
                <CodeEditor
                  value={activeTab.content}
                  onChange={handleContentChangeWithSave}
                  onCursorChange={handleCursorChange}
                />
              ) : (
                <div className="editor-empty">
                  <p>没有打开的文件</p>
                  <p>按 ⌘N 创建新文件</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Terminal Panel - 右侧面板 */}
          <Panel
            activeTab={activePanelTab}
            onTabChange={setActivePanelTab}
            width={terminalWidth}
            onResize={setTerminalWidth}
            isCollapsed={isTerminalCollapsed}
            onToggleCollapse={() => setIsTerminalCollapsed(prev => !prev)}
            onClear={() => {
              clearOutput()
              setClearTrigger(prev => prev + 1)
            }}
          >
            <Terminal
              isRunning={isRunning}
              isCompiling={isCompiling}
              isDarkMode={isDarkMode}
              onClear={clearOutput}
              clearTrigger={clearTrigger}
            />
          </Panel>
        </div>
      </div>
      
      {/* Status Bar */}
      <StatusBar
        ref={statusBarRef}
        isCompiling={isCompiling}
        isRunning={isRunning}
        isDirty={activeTab?.isDirty ?? false}
        line={cursorPosition.line}
        column={cursorPosition.column}
        onTimerEnd={handleTimerEnd}
      />
    </div>
  )
}

export default App
