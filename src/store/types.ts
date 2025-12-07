export interface Tab {
  id: string
  filename: string
  filepath: string | null
  content: string
  isDirty: boolean
  problemId?: string  // 关联的题目ID
}

// Problem types
export interface ProblemExample {
  input: string
  output: string
  explanation?: string
}

export interface Problem {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  inputFormat: string
  outputFormat: string
  examples: ProblemExample[]
  constraints?: string[]
  hints?: string[]
  template: string
}

export interface ProblemConfig {
  problems: Problem[]
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
  
  // Problem State
  problems: Problem[]
  selectedProblemId: string | null
  userCode: Record<string, string>  // problemId -> code
  isProblemPanelCollapsed: boolean
  
  // Problem Actions
  setProblems: (problems: Problem[]) => void
  selectProblem: (problemId: string | null) => void
  saveUserCode: (problemId: string, code: string) => void
  getUserCode: (problemId: string) => string | null
  toggleProblemPanel: () => void
  setProblemPanelVisible: (visible: boolean) => void
  getSelectedProblem: () => Problem | null
}
