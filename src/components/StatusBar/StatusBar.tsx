import { useState, useEffect, useCallback, useRef, memo, useImperativeHandle, forwardRef } from 'react'
import './StatusBar.css'

interface StatusBarProps {
  isCompiling: boolean
  isRunning: boolean
  isDirty: boolean
  line: number
  column: number
  onTimerEnd?: (elapsedTime: number) => void
}

export interface StatusBarRef {
  startTimer: () => void
  pauseTimer: () => void
  stopTimer: () => void
  toggleTimer: () => void
  getElapsedTime: () => number
  isRunning: () => boolean
  isPaused: () => boolean
  getTimerState: () => 'stopped' | 'running' | 'paused'
}

type TimerState = 'stopped' | 'running' | 'paused'

// SVG Icons
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 11.5V14H4.5L11.8733 6.62667L9.37333 4.12667L2 11.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 3L13 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
)

const SavedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 4.5L6.5 11.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CompilingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="spin">
    <path d="M8 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 12V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <path d="M3.05 3.05L5.17 5.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
    <path d="M10.83 10.83L12.95 12.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <path d="M1 8H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    <path d="M12 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <path d="M3.05 12.95L5.17 10.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <path d="M10.83 5.17L12.95 3.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
  </svg>
)

const RunningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2L13 8L4 14V2Z" fill="currentColor"/>
  </svg>
)

const TimerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="9" r="6" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8 5V9L10.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 1H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const PauseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="4" height="12" rx="1" fill="currentColor"/>
    <rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor"/>
  </svg>
)

export const StatusBar = memo(forwardRef<StatusBarRef, StatusBarProps>(({
  isCompiling,
  isRunning,
  isDirty,
  line,
  column,
  onTimerEnd
}, ref) => {
  const [timerState, setTimerState] = useState<TimerState>('stopped')
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const lastClickRef = useRef<number>(0)

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const startTimer = useCallback(() => {
    if (timerState === 'stopped') {
      startTimeRef.current = Date.now()
      pausedTimeRef.current = 0
    } else if (timerState === 'paused') {
      startTimeRef.current = Date.now() - pausedTimeRef.current
    }
    
    setTimerState('running')
    
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current)
    }, 100)
  }, [timerState])

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    pausedTimeRef.current = elapsedTime
    setTimerState('paused')
  }, [elapsedTime])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const finalTime = elapsedTime
    setTimerState('stopped')
    setElapsedTime(0)
    pausedTimeRef.current = 0
    
    if (onTimerEnd && finalTime > 0) {
      onTimerEnd(finalTime)
    }
  }, [elapsedTime, onTimerEnd])

  const handleTimerClick = useCallback(() => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickRef.current
    lastClickRef.current = now

    if (timeSinceLastClick < 300) {
      stopTimer()
      return
    }

    setTimeout(() => {
      if (Date.now() - lastClickRef.current >= 280) {
        if (timerState === 'running') {
          pauseTimer()
        } else if (timerState === 'paused') {
          startTimer()
        } else if (timerState === 'stopped') {
          startTimer()
        }
      }
    }, 300)
  }, [timerState, startTimer, pauseTimer, stopTimer])

  useImperativeHandle(ref, () => ({
    startTimer: () => {
      if (timerState === 'stopped') {
        startTimeRef.current = Date.now()
        pausedTimeRef.current = 0
        setTimerState('running')
        timerRef.current = setInterval(() => {
          setElapsedTime(Date.now() - startTimeRef.current)
        }, 100)
      } else if (timerState === 'paused') {
        // 从暂停状态恢复
        startTimeRef.current = Date.now() - pausedTimeRef.current
        setTimerState('running')
        timerRef.current = setInterval(() => {
          setElapsedTime(Date.now() - startTimeRef.current)
        }, 100)
      }
    },
    pauseTimer,
    stopTimer,
    // toggleTimer: 开关计时器 - 如果在运行或暂停状态则停止并归零，如果停止则开始
    toggleTimer: () => {
      if (timerState === 'running' || timerState === 'paused') {
        // 停止计时器
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        const finalTime = elapsedTime
        setTimerState('stopped')
        setElapsedTime(0)
        pausedTimeRef.current = 0
        if (onTimerEnd && finalTime > 0) {
          onTimerEnd(finalTime)
        }
      } else {
        // 开始新计时器
        startTimeRef.current = Date.now()
        pausedTimeRef.current = 0
        setTimerState('running')
        timerRef.current = setInterval(() => {
          setElapsedTime(Date.now() - startTimeRef.current)
        }, 100)
      }
    },
    getElapsedTime: () => elapsedTime,
    isRunning: () => timerState === 'running',
    isPaused: () => timerState === 'paused',
    getTimerState: () => timerState
  }), [timerState, elapsedTime, pauseTimer, stopTimer, startTimer, onTimerEnd])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const getStatusInfo = () => {
    if (isCompiling) return { text: 'Compiling', icon: <CompilingIcon />, className: 'compiling' }
    if (isRunning) return { text: 'Running', icon: <RunningIcon />, className: 'running' }
    if (isDirty) return { text: 'Editing', icon: <EditIcon />, className: 'editing' }
    return { text: 'Saved', icon: <SavedIcon />, className: 'saved' }
  }

  const getTimerClass = () => {
    if (timerState === 'running') return 'timer running'
    if (timerState === 'paused') return 'timer paused'
    return 'timer'
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className={`status-item status-state ${statusInfo.className}`}>
          <span className="status-icon">{statusInfo.icon}</span>
          <span className="status-text">{statusInfo.text}</span>
        </span>
      </div>
      
      <div className="status-bar-center">
        <div 
          className={getTimerClass()}
          onClick={handleTimerClick}
          title="Click to pause/resume, double-click to stop"
        >
          <span className="timer-icon"><TimerIcon /></span>
          <span className="timer-value">{formatTime(elapsedTime)}</span>
          {timerState === 'paused' && <span className="timer-paused-indicator"><PauseIcon /></span>}
        </div>
      </div>
      
      <div className="status-bar-right">
        <span className="status-item cursor-position">
          Ln {line}, Col {column}
        </span>
        <span className="status-item language">C</span>
      </div>
    </div>
  )
}))

StatusBar.displayName = 'StatusBar'

export default StatusBar
