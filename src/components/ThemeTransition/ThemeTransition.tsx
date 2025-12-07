import { useEffect, useState } from 'react'
import './ThemeTransition.css'

interface ThemeTransitionProps {
  isDarkMode: boolean
  show: boolean
  onAnimationEnd: () => void
}

export function ThemeTransition({ isDarkMode, show, onAnimationEnd }: ThemeTransitionProps) {
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (show) {
      setAnimating(true)
      const timer = setTimeout(() => {
        setAnimating(false)
        onAnimationEnd()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [show, onAnimationEnd])

  if (!show && !animating) return null

  return (
    <div className="theme-transition-overlay">
      <div className={`theme-transition-card ${isDarkMode ? 'to-dark' : 'to-light'}`}>
        <div className="icon-container">
          {/* Sun */}
          <svg className="sun-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" fill="#FFD700" />
            <g className="sun-rays">
              <line x1="12" y1="1" x2="12" y2="4" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="20" x2="12" y2="23" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
              <line x1="1" y1="12" x2="4" y2="12" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
              <line x1="20" y1="12" x2="23" y2="12" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
              <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
              <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
              <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
              <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
          {/* Moon */}
          <svg className="moon-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
              fill="#E8E8E8" 
              stroke="#C0C0C0" 
              strokeWidth="1"
            />
            <circle cx="9" cy="9" r="1.5" fill="#C0C0C0" opacity="0.5" />
            <circle cx="13" cy="14" r="1" fill="#C0C0C0" opacity="0.5" />
            <circle cx="7" cy="14" r="0.8" fill="#C0C0C0" opacity="0.5" />
          </svg>
        </div>
        <div className="theme-label">
          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </div>
      </div>
    </div>
  )
}
