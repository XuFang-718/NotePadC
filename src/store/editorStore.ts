import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { EditorState, Tab, OutputLine } from './types'

const MIN_SPLIT_RATIO = 0.2
const MAX_SPLIT_RATIO = 0.8
const MAX_OUTPUT_LINES = 1000 // 限制输出行数，防止内存溢出

// 缓存文件名提取结果
const filenameCache = new Map<string, string>()

export function extractFilename(filepath: string): string {
  if (filenameCache.has(filepath)) {
    return filenameCache.get(filepath)!
  }
  const parts = filepath.split(/[/\\]/)
  const filename = parts[parts.length - 1] || 'Untitled.c'
  filenameCache.set(filepath, filename)
  return filename
}

export function clampSplitRatio(ratio: number): number {
  return Math.max(MIN_SPLIT_RATIO, Math.min(MAX_SPLIT_RATIO, ratio))
}

// 防抖函数
function debounce<T extends (...args: number[]) => void>(fn: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

// 使用 subscribeWithSelector 中间件优化订阅
export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tabs: [],
    activeTabId: null,
    isCompiling: false,
    isRunning: false,
    output: [],
    splitRatio: 0.6,
    isDarkMode: false,

    // Tab Actions - 使用 Immer-like 不可变更新优化
    addTab: (tabData: Partial<Tab>) => {
      const id = uuidv4()
      const newTab: Tab = {
        id,
        filename: tabData.filename || 'Untitled.c',
        filepath: tabData.filepath || null,
        content: tabData.content || '',
        isDirty: tabData.isDirty ?? (tabData.filepath === null || tabData.filepath === undefined)
      }
      
      set((state) => ({
        tabs: [...state.tabs, newTab],
        activeTabId: id
      }))
      
      return id
    },

    removeTab: (tabId: string) => {
      set((state) => {
        const tabIndex = state.tabs.findIndex(t => t.id === tabId)
        if (tabIndex === -1) return state
        
        const newTabs = state.tabs.filter(t => t.id !== tabId)
        let newActiveTabId = state.activeTabId
        
        if (state.activeTabId === tabId) {
          if (newTabs.length === 0) {
            newActiveTabId = null
          } else if (tabIndex >= newTabs.length) {
            newActiveTabId = newTabs[newTabs.length - 1].id
          } else {
            newActiveTabId = newTabs[tabIndex].id
          }
        }
        
        return {
          tabs: newTabs,
          activeTabId: newActiveTabId
        }
      })
    },

    setActiveTab: (tabId: string) => {
      const state = get()
      // 避免不必要的更新
      if (state.activeTabId === tabId) return
      if (state.tabs.some(t => t.id === tabId)) {
        set({ activeTabId: tabId })
      }
    },

    // 优化：只更新变化的 tab，使用浅比较
    updateTabContent: (tabId: string, content: string) => {
      set((state) => {
        const tab = state.tabs.find(t => t.id === tabId)
        // 如果内容没变，不更新
        if (!tab || tab.content === content) return state
        
        return {
          tabs: state.tabs.map(t =>
            t.id === tabId
              ? { ...t, content, isDirty: true }
              : t
          )
        }
      })
    },

    markTabDirty: (tabId: string, isDirty: boolean) => {
      set((state) => {
        const tab = state.tabs.find(t => t.id === tabId)
        // 如果状态没变，不更新
        if (!tab || tab.isDirty === isDirty) return state
        
        return {
          tabs: state.tabs.map(t =>
            t.id === tabId ? { ...t, isDirty } : t
          )
        }
      })
    },

    updateTabFilepath: (tabId: string, filepath: string, filename: string) => {
      set((state) => ({
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? { ...tab, filepath, filename, isDirty: false } : tab
        )
      }))
    },

    // Compiler Actions - 优化输出追加，限制最大行数
    appendOutput: (line: Omit<OutputLine, 'timestamp'>) => {
      const outputLine: OutputLine = {
        ...line,
        timestamp: Date.now()
      }
      set((state) => {
        const newOutput = [...state.output, outputLine]
        // 限制输出行数，使用滑动窗口
        if (newOutput.length > MAX_OUTPUT_LINES) {
          return { output: newOutput.slice(-MAX_OUTPUT_LINES) }
        }
        return { output: newOutput }
      })
    },

    clearOutput: () => {
      set({ output: [] })
    },

    setCompiling: (isCompiling: boolean) => {
      const state = get()
      if (state.isCompiling === isCompiling) return
      set({ isCompiling })
    },

    setRunning: (isRunning: boolean) => {
      const state = get()
      if (state.isRunning === isRunning) return
      set({ isRunning })
    },

    // UI Actions
    setSplitRatio: (ratio: number) => {
      const clamped = clampSplitRatio(ratio)
      const state = get()
      // 避免微小变化导致的重渲染
      if (Math.abs(state.splitRatio - clamped) < 0.001) return
      set({ splitRatio: clamped })
    },

    toggleDarkMode: () => {
      set((state) => {
        const newDarkMode = !state.isDarkMode
        document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light')
        return { isDarkMode: newDarkMode }
      })
    },

    setDarkMode: (isDarkMode: boolean) => {
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
      set({ isDarkMode })
    },

    // Helpers - 使用缓存优化
    getActiveTab: () => {
      const state = get()
      return state.tabs.find(t => t.id === state.activeTabId) || null
    },

    hasUnsavedChanges: (tabId: string) => {
      const state = get()
      const tab = state.tabs.find(t => t.id === tabId)
      return tab?.isDirty ?? false
    }
  }))
)

// 导出防抖版本的 setSplitRatio 用于拖拽
export const debouncedSetSplitRatio = debounce(
  (ratio: number) => useEditorStore.getState().setSplitRatio(ratio),
  16 // ~60fps
)
