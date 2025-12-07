import { OutputLine } from '../store/types'

export interface CompileError {
  line: number
  column: number
  message: string
}

/**
 * Parse compiler error output from gcc/clang
 * Handles formats like:
 * - filename:line:column: error: message
 * - filename:line:column: warning: message
 * - filename:line: error: message (no column)
 */
export function parseCompilerOutput(stderr: string): CompileError[] {
  const errors: CompileError[] = []
  const lines = stderr.split('\n')
  
  // Pattern for gcc/clang errors with column: filename:line:column: type: message
  const errorWithColumnPattern = /^[^:]+:(\d+):(\d+):\s*(error|warning|note):\s*(.+)$/
  // Pattern for errors without column: filename:line: type: message
  const errorWithoutColumnPattern = /^[^:]+:(\d+):\s*(error|warning|note):\s*(.+)$/
  
  for (const line of lines) {
    let match = line.match(errorWithColumnPattern)
    if (match) {
      errors.push({
        line: parseInt(match[1], 10),
        column: parseInt(match[2], 10),
        message: `${match[3]}: ${match[4]}`
      })
      continue
    }
    
    match = line.match(errorWithoutColumnPattern)
    if (match) {
      errors.push({
        line: parseInt(match[1], 10),
        column: 0,
        message: `${match[2]}: ${match[3]}`
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

/**
 * Convert compile errors to OutputLine format for display
 */
export function errorsToOutputLines(errors: CompileError[]): OutputLine[] {
  return errors.map(error => ({
    type: 'error' as const,
    content: error.line > 0 
      ? `Line ${error.line}: ${error.message}`
      : error.message,
    lineNumber: error.line > 0 ? error.line : undefined,
    timestamp: Date.now()
  }))
}

/**
 * Create an info output line
 */
export function createInfoLine(content: string): Omit<OutputLine, 'timestamp'> {
  return {
    type: 'info',
    content
  }
}

/**
 * Create an output line for program stdout
 */
export function createOutputLine(content: string): Omit<OutputLine, 'timestamp'> {
  return {
    type: 'output',
    content
  }
}

/**
 * Create an input echo line
 */
export function createInputLine(content: string): Omit<OutputLine, 'timestamp'> {
  return {
    type: 'input',
    content: `> ${content}`
  }
}
