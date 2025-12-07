/// <reference types="vite/client" />

interface FileResult {
  filepath: string
  content: string
}

interface CompileResult {
  success: boolean
  executablePath?: string
  errors?: Array<{
    line: number
    column: number
    message: string
  }>
}

interface AppConfig {
  isDarkMode: boolean
  autoSaveEnabled: boolean
  windowBounds?: { width: number; height: number; x?: number; y?: number }
}

interface ProblemConfig {
  problems: Array<{
    id: string
    title: string
    difficulty: 'easy' | 'medium' | 'hard'
    description: string
    inputFormat: string
    outputFormat: string
    examples: Array<{ input: string; output: string; explanation?: string }>
    constraints?: string[]
    hints?: string[]
    template: string
  }>
}

interface ElectronAPI {
  openFileDialog: () => Promise<FileResult | null>
  saveFileDialog: (content: string) => Promise<string | null>
  saveFile: (filepath: string, content: string) => Promise<string>
  readFile: (filepath: string) => Promise<string>
  saveToDesktop: (content: string) => Promise<string>
  getConfig: () => Promise<AppConfig>
  setConfig: (key: string, value: unknown) => Promise<AppConfig>
  setDarkMode: (isDarkMode: boolean) => Promise<AppConfig>
  loadProblems: () => Promise<ProblemConfig>
  saveUserCode: (problemId: string, code: string) => Promise<string>
  loadUserCode: (problemId: string) => Promise<string | null>
  compile: (filepath: string) => Promise<CompileResult>
  runExecutable: (executablePath: string) => Promise<boolean>
  sendInput: (input: string) => void
  stopProcess: () => void
  resizePty: (cols: number, rows: number) => void
  onOutput: (callback: (output: string) => void) => () => void
  onProcessExit: (callback: (code: number, stats?: { executionTime: number; cpuTime: number; peakMemory: number }) => void) => () => void
  onMenuNewFile: (callback: () => void) => () => void
  onMenuOpenFile: (callback: () => void) => () => void
  onMenuSaveFile: (callback: () => void) => () => void
  onMenuRun: (callback: () => void) => () => void
  onMenuStop: (callback: () => void) => () => void
  onMenuAutoSaveToggle: (callback: (enabled: boolean) => void) => () => void
  onMenuToggleProblems: (callback: (show: boolean) => void) => () => void
}

interface Window {
  electronAPI?: ElectronAPI
}
