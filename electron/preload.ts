import { contextBridge, ipcRenderer } from 'electron'

export interface FileResult {
  filepath: string
  content: string
}

export interface CompileResult {
  success: boolean
  executablePath?: string
  errors?: Array<{
    line: number
    column: number
    message: string
  }>
}

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFileDialog: (): Promise<FileResult | null> => 
    ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (content: string): Promise<string | null> => 
    ipcRenderer.invoke('save-file-dialog', content),
  saveFile: (filepath: string, content: string): Promise<string> => 
    ipcRenderer.invoke('save-file', filepath, content),
  readFile: (filepath: string): Promise<string> => 
    ipcRenderer.invoke('read-file', filepath),
  saveToDesktop: (content: string): Promise<string> =>
    ipcRenderer.invoke('save-to-desktop', content),
  
  // Compiler operations
  compile: (filepath: string): Promise<CompileResult> => 
    ipcRenderer.invoke('compile', filepath),
  runExecutable: (executablePath: string): Promise<boolean> =>
    ipcRenderer.invoke('run-executable', executablePath),
  sendInput: (input: string): void => 
    ipcRenderer.send('send-input', input),
  stopProcess: (): void => 
    ipcRenderer.send('stop-process'),
  
  // Event listeners
  onOutput: (callback: (output: string) => void) => {
    const handler = (_: unknown, output: string) => callback(output)
    ipcRenderer.on('process-output', handler)
    return () => ipcRenderer.removeListener('process-output', handler)
  },
  onProcessExit: (callback: (code: number) => void) => {
    const handler = (_: unknown, code: number) => callback(code)
    ipcRenderer.on('process-exit', handler)
    return () => ipcRenderer.removeListener('process-exit', handler)
  },
  
  // Menu events
  onMenuNewFile: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('menu-new-file', handler)
    return () => ipcRenderer.removeListener('menu-new-file', handler)
  },
  onMenuOpenFile: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('menu-open-file', handler)
    return () => ipcRenderer.removeListener('menu-open-file', handler)
  },
  onMenuSaveFile: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('menu-save-file', handler)
    return () => ipcRenderer.removeListener('menu-save-file', handler)
  },
  onMenuRun: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('menu-run', handler)
    return () => ipcRenderer.removeListener('menu-run', handler)
  },
  onMenuStop: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('menu-stop', handler)
    return () => ipcRenderer.removeListener('menu-stop', handler)
  },
  onMenuAutoSaveToggle: (callback: (enabled: boolean) => void) => {
    const handler = (_: unknown, enabled: boolean) => callback(enabled)
    ipcRenderer.on('menu-auto-save-toggle', handler)
    return () => ipcRenderer.removeListener('menu-auto-save-toggle', handler)
  }
})
