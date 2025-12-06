import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null
let runningProcess: ChildProcess | null = null

// 配置文件系统
interface AppConfig {
  isDarkMode: boolean
  autoSaveEnabled: boolean
  windowBounds?: { width: number; height: number; x?: number; y?: number }
}

const defaultConfig: AppConfig = {
  isDarkMode: false,
  autoSaveEnabled: false
}

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'config.json')
}

function loadConfig(): AppConfig {
  try {
    const configPath = getConfigPath()
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      return { ...defaultConfig, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('Failed to load config:', error)
  }
  return { ...defaultConfig }
}

function saveConfig(config: AppConfig): void {
  try {
    const configPath = getConfigPath()
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save config:', error)
  }
}

let appConfig = loadConfig()

function createWindow() {
  const bounds = appConfig.windowBounds || { width: 1400, height: 900 }
  
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: appConfig.isDarkMode ? '#1E1E1E' : '#FFFFFF',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 保存窗口位置和大小
  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      appConfig.windowBounds = bounds
      saveConfig(appConfig)
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-new-file')
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-open-file')
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-save-file')
        },
        { type: 'separator' },
        {
          id: 'auto-save',
          label: 'Auto Save',
          type: 'checkbox',
          checked: appConfig.autoSaveEnabled,
          click: (menuItem) => {
            appConfig.autoSaveEnabled = menuItem.checked
            saveConfig(appConfig)
            mainWindow?.webContents.send('menu-auto-save-toggle', appConfig.autoSaveEnabled)
          }
        },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Run',
      submenu: [
        {
          label: 'Run',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.send('menu-run')
        },
        {
          label: 'Stop',
          accelerator: 'CmdOrCtrl+.',
          click: () => mainWindow?.webContents.send('menu-stop')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers - File Operations
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'C Source Files', extensions: ['c', 'h'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  
  const filepath = result.filePaths[0]
  const content = fs.readFileSync(filepath, 'utf-8')
  return { filepath, content }
})

ipcMain.handle('save-file-dialog', async (_, content: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: [
      { name: 'C Source Files', extensions: ['c'] },
      { name: 'Header Files', extensions: ['h'] }
    ]
  })
  
  if (result.canceled || !result.filePath) {
    return null
  }
  
  fs.writeFileSync(result.filePath, content, 'utf-8')
  return result.filePath
})

ipcMain.handle('save-file', async (_, filepath: string, content: string) => {
  fs.writeFileSync(filepath, content, 'utf-8')
  return filepath
})

ipcMain.handle('read-file', async (_, filepath: string) => {
  return fs.readFileSync(filepath, 'utf-8')
})

// 自动保存到桌面
ipcMain.handle('save-to-desktop', async (_, content: string) => {
  const desktopPath = app.getPath('desktop')
  const filepath = path.join(desktopPath, 'NONAME.c')
  fs.writeFileSync(filepath, content, 'utf-8')
  return filepath
})

// 配置文件操作
ipcMain.handle('get-config', () => {
  return appConfig
})

ipcMain.handle('set-config', (_, key: keyof AppConfig, value: unknown) => {
  (appConfig as Record<string, unknown>)[key] = value
  saveConfig(appConfig)
  return appConfig
})

ipcMain.handle('set-dark-mode', (_, isDarkMode: boolean) => {
  appConfig.isDarkMode = isDarkMode
  saveConfig(appConfig)
  return appConfig
})


// IPC Handlers - Compiler Operations
ipcMain.handle('compile', async (_, filepath: string) => {
  return new Promise((resolve) => {
    const outputDir = path.dirname(filepath)
    const basename = path.basename(filepath, path.extname(filepath))
    const executablePath = path.join(outputDir, basename)
    
    // Use clang on macOS, gcc as fallback
    // Compile with C89/ANSI C standard (Turbo C compatible)
    const compiler = process.platform === 'darwin' ? 'clang' : 'gcc'
    
    const compileProcess = spawn(compiler, [
      filepath,
      '-o', executablePath,
      '-std=c89',           // Turbo C 使用 ANSI C89 标准
      '-ansi',              // 严格 ANSI 模式
      '-pedantic',          // 严格遵循标准
      '-Wno-deprecated',    // 允许旧式函数声明
      '-D__TURBOC__'        // 定义 Turbo C 宏以兼容旧代码
    ])
    
    let stderr = ''
    
    compileProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    compileProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          executablePath
        })
      } else {
        // Parse compiler errors
        const errors = parseCompilerErrors(stderr)
        resolve({
          success: false,
          errors
        })
      }
    })
    
    compileProcess.on('error', (err) => {
      resolve({
        success: false,
        errors: [{
          line: 0,
          column: 0,
          message: `Compiler not found: ${err.message}. Please install clang or gcc.`
        }]
      })
    })
  })
})

function parseCompilerErrors(stderr: string): Array<{ line: number; column: number; message: string }> {
  const errors: Array<{ line: number; column: number; message: string }> = []
  const lines = stderr.split('\n')
  
  // Pattern for gcc/clang errors: filename:line:column: error: message
  const errorPattern = /^[^:]+:(\d+):(\d+):\s*(error|warning):\s*(.+)$/
  
  for (const line of lines) {
    const match = line.match(errorPattern)
    if (match) {
      errors.push({
        line: parseInt(match[1], 10),
        column: parseInt(match[2], 10),
        message: `${match[3]}: ${match[4]}`
      })
    }
  }
  
  // If no structured errors found, return the whole stderr as one error
  if (errors.length === 0 && stderr.trim()) {
    errors.push({
      line: 0,
      column: 0,
      message: stderr.trim()
    })
  }
  
  return errors
}

ipcMain.on('send-input', (_, input: string) => {
  if (runningProcess && runningProcess.stdin) {
    runningProcess.stdin.write(input + '\n')
  }
})

ipcMain.on('stop-process', () => {
  if (runningProcess) {
    runningProcess.kill('SIGTERM')
    runningProcess = null
  }
})

ipcMain.handle('run-executable', async (event, executablePath: string) => {
  return new Promise((resolve) => {
    // Kill any existing process
    if (runningProcess) {
      runningProcess.kill('SIGTERM')
    }
    
    runningProcess = spawn(executablePath, [], {
      cwd: path.dirname(executablePath)
    })
    
    runningProcess.stdout?.on('data', (data) => {
      mainWindow?.webContents.send('process-output', data.toString())
    })
    
    runningProcess.stderr?.on('data', (data) => {
      mainWindow?.webContents.send('process-output', data.toString())
    })
    
    runningProcess.on('close', (code) => {
      mainWindow?.webContents.send('process-exit', code ?? 0)
      runningProcess = null
    })
    
    runningProcess.on('error', (err) => {
      mainWindow?.webContents.send('process-output', `Error: ${err.message}`)
      mainWindow?.webContents.send('process-exit', 1)
      runningProcess = null
    })
    
    resolve(true)
  })
})
