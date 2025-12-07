import { useEffect, useRef, useCallback, memo } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import './Terminal.css'

interface TerminalProps {
  isRunning: boolean
  isCompiling: boolean
  isDarkMode: boolean
  onClear: () => void
}

export const Terminal = memo(({
  isRunning,
  isCompiling,
  isDarkMode,
  onClear
}: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const unsubOutputRef = useRef<(() => void) | null>(null)
  const unsubExitRef = useRef<(() => void) | null>(null)

  // 初始化终端
  useEffect(() => {
    if (!terminalRef.current) return

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'SF Mono', Monaco, 'Courier New', monospace",
      theme: isDarkMode ? {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      } : {
        background: '#ffffff',
        foreground: '#333333',
        cursor: '#333333',
        cursorAccent: '#ffffff',
        selectionBackground: '#add6ff',
        black: '#000000',
        red: '#cd3131',
        green: '#00bc00',
        yellow: '#949800',
        blue: '#0451a5',
        magenta: '#bc05bc',
        cyan: '#0598bc',
        white: '#555555',
        brightBlack: '#666666',
        brightRed: '#cd3131',
        brightGreen: '#14ce14',
        brightYellow: '#b5ba00',
        brightBlue: '#0451a5',
        brightMagenta: '#bc05bc',
        brightCyan: '#0598bc',
        brightWhite: '#a5a5a5'
      },
      allowTransparency: false,
      scrollback: 1000,
      convertEol: true
    })

    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.open(terminalRef.current)
    
    // 初始适配大小
    setTimeout(() => {
      fitAddon.fit()
      if (window.electronAPI) {
        window.electronAPI.resizePty(xterm.cols, xterm.rows)
      }
    }, 0)

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // 处理用户输入
    xterm.onData((data) => {
      if (window.electronAPI) {
        window.electronAPI.sendInput(data)
      }
    })

    // 监听窗口大小变化
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit()
        if (window.electronAPI) {
          window.electronAPI.resizePty(xtermRef.current.cols, xtermRef.current.rows)
        }
      }
    }
    window.addEventListener('resize', handleResize)

    // 显示欢迎信息
    xterm.writeln('\x1b[36m欢迎使用 NotePadC 终端\x1b[0m')
    xterm.writeln('按 ⌘R 编译并运行代码')
    xterm.writeln('')

    return () => {
      window.removeEventListener('resize', handleResize)
      xterm.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, []) // 只在挂载时初始化一次

  // 每次开始编译时清除终端
  useEffect(() => {
    if (isCompiling && xtermRef.current) {
      xtermRef.current.clear()
      xtermRef.current.write('\x1b[2J\x1b[H') // 清屏并移动光标到左上角
    }
  }, [isCompiling])

  // 更新主题
  useEffect(() => {
    if (!xtermRef.current) return
    
    xtermRef.current.options.theme = isDarkMode ? {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
      cursorAccent: '#1e1e1e',
      selectionBackground: '#264f78'
    } : {
      background: '#ffffff',
      foreground: '#333333',
      cursor: '#333333',
      cursorAccent: '#ffffff',
      selectionBackground: '#add6ff'
    }
  }, [isDarkMode])

  // 监听进程输出
  useEffect(() => {
    if (!window.electronAPI) return

    // 清理之前的监听器
    if (unsubOutputRef.current) {
      unsubOutputRef.current()
    }
    if (unsubExitRef.current) {
      unsubExitRef.current()
    }

    unsubOutputRef.current = window.electronAPI.onOutput((data) => {
      if (xtermRef.current) {
        xtermRef.current.write(data)
      }
    })

    unsubExitRef.current = window.electronAPI.onProcessExit((code, stats) => {
      if (xtermRef.current) {
        xtermRef.current.writeln('')
        xtermRef.current.writeln('\x1b[90m─'.repeat(40) + '\x1b[0m')
        
        // 格式化时间显示
        const formatTime = (ms: number) => {
          if (ms < 1000) return `${ms}ms`
          return `${(ms / 1000).toFixed(2)}s`
        }
        
        if (code === 0) {
          xtermRef.current.writeln('\x1b[32m✓ 程序正常退出\x1b[0m')
        } else if (code === -9) {
          xtermRef.current.writeln('\x1b[33m⚠ 程序被终止\x1b[0m')
        } else {
          xtermRef.current.writeln(`\x1b[31m✗ 程序退出，代码: ${code}\x1b[0m`)
        }
        
        // 显示详细统计信息（竞赛风格）
        if (stats) {
          // 格式化内存显示
          const formatMemory = (kb: number) => {
            if (kb < 1024) return `${kb} KB`
            return `${(kb / 1024).toFixed(2)} MB`
          }
          
          xtermRef.current.writeln('')
          xtermRef.current.writeln(`\x1b[90m⏱ Time: \x1b[36m${formatTime(stats.cpuTime)}\x1b[90m  │  💾 Memory: \x1b[35m${formatMemory(stats.peakMemory)}\x1b[0m`)
        }
      }
    })

    return () => {
      if (unsubOutputRef.current) {
        unsubOutputRef.current()
        unsubOutputRef.current = null
      }
      if (unsubExitRef.current) {
        unsubExitRef.current()
        unsubExitRef.current = null
      }
    }
  }, [])

  // 处理清除
  const handleClear = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.clear()
    }
    onClear()
  }, [onClear])

  // 适配大小（当面板大小变化时）
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit()
        if (window.electronAPI) {
          window.electronAPI.resizePty(xtermRef.current.cols, xtermRef.current.rows)
        }
      }
    })

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // 获取标题
  const title = isCompiling ? '⏳ 编译中...' : isRunning ? '▶ 运行中' : '终端'

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <span className="terminal-title">{title}</span>
        <button className="terminal-clear-btn" onClick={handleClear} title="清除终端">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className="terminal-container" ref={terminalRef} />
    </div>
  )
})

Terminal.displayName = 'Terminal'

export default Terminal
