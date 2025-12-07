export interface Tab {
  id: string
  filename: string
  filepath: string | null
  content: string
  isDirty: boolean
}

export interface OutputLine {
  type: 'info' | 'error' | 'output' | 'input'
  content: string
  lineNumber?: number
  timestamp: number
}

export interface EditorState {
  // Tabs
  tabs: Tab[]
  activeTabId: string | null
  
  // Compiler
  isCompiling: boolean
  isRunning: boolean
  output: OutputLine[]
  
  // UI
  splitRatio: number
  isDarkMode: boolean
  
  // Tab Actions
  addTab: (tab: Partial<Tab>) => string
  removeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  markTabDirty: (tabId: string, isDirty: boolean) => void
  updateTabFilepath: (tabId: string, filepath: string, filename: string) => void
  
  // Compiler Actions
  appendOutput: (line: Omit<OutputLine, 'timestamp'>) => void
  clearOutput: () => void
  setCompiling: (isCompiling: boolean) => void
  setRunning: (isRunning: boolean) => void
  
  // UI Actions
  setSplitRatio: (ratio: number) => void
  toggleDarkMode: () => void
  setDarkMode: (isDarkMode: boolean) => void
  
  // Helpers
  getActiveTab: () => Tab | null
  hasUnsavedChanges: (tabId: string) => boolean
}
