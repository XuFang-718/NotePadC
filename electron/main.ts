import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as pty from 'node-pty'

let mainWindow: BrowserWindow | null = null
let runningProcess: ChildProcess | null = null
let ptyProcess: pty.IPty | null = null
let processStartTime: number = 0  // 进程启动时间
let userInputTime: number = 0     // 用户输入累计时间
let lastOutputTime: number = 0    // 上次输出时间（用于计算等待输入时间）
let isWaitingForInput: boolean = false  // 是否在等待用户输入
let peakMemory: number = 0        // 内存峰值 (KB)
let memoryMonitorInterval: NodeJS.Timeout | null = null  // 内存监控定时器

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
  const isMac = process.platform === 'darwin'
  
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 15, y: 15 } : undefined,
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
  const isMac = process.platform === 'darwin'
  
  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS 应用菜单
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
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
        {
          id: 'toggle-problems',
          label: 'Show Problem Panel',
          type: 'checkbox',
          checked: true,
          accelerator: 'CmdOrCtrl+Shift+P',
          click: (menuItem) => {
            mainWindow?.webContents.send('menu-toggle-problems', menuItem.checked)
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
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

// IPC Handlers - Problem Operations
function getProblemsConfigPath(): string {
  return path.join(app.getPath('userData'), 'problems.json')
}

function getUserCodeDir(): string {
  const dir = path.join(app.getPath('userData'), 'user-code')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

ipcMain.handle('load-problems', async () => {
  const configPath = getProblemsConfigPath()
  
  // 如果用户目录没有配置文件，从应用目录复制默认配置
  if (!fs.existsSync(configPath)) {
    // 开发环境和生产环境的默认配置路径不同
    const devPath = path.join(__dirname, '../problems.json')
    const prodPath = path.join(process.resourcesPath, 'problems.json')
    const defaultPath = fs.existsSync(devPath) ? devPath : prodPath
    
    if (fs.existsSync(defaultPath)) {
      fs.copyFileSync(defaultPath, configPath)
    } else {
      // 创建空配置
      fs.writeFileSync(configPath, JSON.stringify({ problems: [] }, null, 2), 'utf-8')
    }
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to load problems:', error)
    return { problems: [] }
  }
})

ipcMain.handle('save-user-code', async (_, problemId: string, code: string) => {
  const filepath = path.join(getUserCodeDir(), `${problemId}.c`)
  fs.writeFileSync(filepath, code, 'utf-8')
  return filepath
})

ipcMain.handle('load-user-code', async (_, problemId: string) => {
  const filepath = path.join(getUserCodeDir(), `${problemId}.c`)
  if (fs.existsSync(filepath)) {
    return fs.readFileSync(filepath, 'utf-8')
  }
  return null
})

// IPC Handlers - Compiler Operations
ipcMain.handle('compile', async (_, filepath: string) => {
  return new Promise((resolve) => {
    const outputDir = path.dirname(filepath)
    const basename = path.basename(filepath, path.extname(filepath))
    const isWin = process.platform === 'win32'
    const executablePath = path.join(outputDir, basename + (isWin ? '.exe' : ''))
    
    // Use clang on macOS, gcc on Windows/Linux
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
  // 如果正在等待输入，累计用户输入时间
  if (isWaitingForInput && lastOutputTime > 0) {
    userInputTime += Date.now() - lastOutputTime
    isWaitingForInput = false
  }
  
  if (ptyProcess) {
    ptyProcess.write(input)
  } else if (runningProcess && runningProcess.stdin) {
    runningProcess.stdin.write(input + '\n')
  }
})

ipcMain.on('stop-process', () => {
  if (ptyProcess) {
    ptyProcess.kill()
    ptyProcess = null
    mainWindow?.webContents.send('process-exit', -9)
  } else if (runningProcess) {
    const pid = runningProcess.pid
    const isWin = process.platform === 'win32'
    
    if (isWin) {
      spawn('taskkill', ['/pid', String(pid), '/f', '/t'])
      runningProcess = null
      mainWindow?.webContents.send('process-exit', -9)
    } else {
      runningProcess.kill('SIGTERM')
      setTimeout(() => {
        if (runningProcess && runningProcess.pid === pid) {
          try {
            process.kill(-pid!, 'SIGKILL')
          } catch {
            try {
              runningProcess?.kill('SIGKILL')
            } catch {
              // ignore
            }
          }
          runningProcess = null
          mainWindow?.webContents.send('process-exit', -9)
        }
      }, 500)
    }
  }
})

ipcMain.handle('run-executable', async (event, executablePath: string) => {
  return new Promise((resolve) => {
    // Kill any existing PTY process
    if (ptyProcess) {
      ptyProcess.kill()
      ptyProcess = null
    }
    if (runningProcess) {
      runningProcess.kill('SIGKILL')
      runningProcess = null
    }
    
    // 重置计时器和内存统计
    processStartTime = Date.now()
    userInputTime = 0
    lastOutputTime = 0
    isWaitingForInput = false
    peakMemory = 0
    
    // 使用 node-pty 创建真正的伪终端
    // 这样可以解决 stdout 缓冲问题，程序会认为自己在真实终端中运行
    const shell = process.platform === 'win32' ? 'cmd.exe' : executablePath
    const args = process.platform === 'win32' ? ['/c', executablePath] : []
    
    ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: path.dirname(executablePath),
      env: process.env as { [key: string]: string }
    })
    
    // 启动内存监控 (每 50ms 采样一次)
    const ptyPid = ptyProcess.pid
    memoryMonitorInterval = setInterval(() => {
      if (ptyPid && process.platform === 'darwin') {
        // macOS: 使用 ps 获取 RSS (Resident Set Size)
        const psProcess = spawn('ps', ['-o', 'rss=', '-p', String(ptyPid)])
        let output = ''
        psProcess.stdout.on('data', (data) => { output += data.toString() })
        psProcess.on('close', () => {
          const rss = parseInt(output.trim(), 10)
          if (!isNaN(rss) && rss > peakMemory) {
            peakMemory = rss
          }
        })
      }
    }, 50)
    
    ptyProcess.onData((data: string) => {
      // 记录输出时间，标记开始等待输入
      lastOutputTime = Date.now()
      isWaitingForInput = true
      mainWindow?.webContents.send('process-output', data)
    })
    
    ptyProcess.onExit(({ exitCode }) => {
      // 停止内存监控
      if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval)
        memoryMonitorInterval = null
      }
      
      const totalTime = Date.now() - processStartTime
      const cpuTime = totalTime - userInputTime  // 纯执行时间 = 总时间 - 用户输入时间
      mainWindow?.webContents.send('process-exit', exitCode, { 
        executionTime: totalTime,
        cpuTime,
        peakMemory  // KB
      })
      ptyProcess = null
    })
    
    resolve(true)
  })
})

// 调整 PTY 终端大小
ipcMain.on('resize-pty', (_, cols: number, rows: number) => {
  if (ptyProcess) {
    ptyProcess.resize(cols, rows)
  }
})
