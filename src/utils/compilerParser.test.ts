import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { parseCompilerOutput, errorsToOutputLines, CompileError } from './compilerParser'

/**
 * **Feature: c-code-editor, Property 6: Compile Error Parsing**
 * **Validates: Requirements 4.5**
 * 
 * For any compiler error output string, the parser SHALL extract:
 * - Line number (integer)
 * - Column number (integer, if available)
 * - Error message (string)
 * And produce OutputLine objects with type 'error' and correct lineNumber field.
 */
describe('Property 6: Compile Error Parsing', () => {
  it('should parse gcc/clang error format with column', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => !s.includes(':') && !s.includes('\n') && s.trim().length > 0),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.constantFrom('error', 'warning'),
        fc.string({ minLength: 1 }).filter(s => !s.includes('\n') && s.trim().length > 0),
        (filename, line, column, type, message) => {
          const stderr = `${filename}.c:${line}:${column}: ${type}: ${message}`
          const errors = parseCompilerOutput(stderr)
          
          expect(errors.length).toBe(1)
          expect(errors[0].line).toBe(line)
          expect(errors[0].column).toBe(column)
          expect(errors[0].message).toContain(type)
          expect(errors[0].message).toContain(message.trim())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should parse multiple errors from multiline output', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            line: fc.integer({ min: 1, max: 10000 }),
            column: fc.integer({ min: 1, max: 1000 }),
            message: fc.string({ minLength: 1 }).filter(s => !s.includes('\n') && !s.includes(':'))
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (errorData) => {
          const stderr = errorData
            .map(e => `test.c:${e.line}:${e.column}: error: ${e.message}`)
            .join('\n')
          
          const errors = parseCompilerOutput(stderr)
          
          expect(errors.length).toBe(errorData.length)
          for (let i = 0; i < errorData.length; i++) {
            expect(errors[i].line).toBe(errorData[i].line)
            expect(errors[i].column).toBe(errorData[i].column)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should convert errors to OutputLine with correct type and lineNumber', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            line: fc.integer({ min: 1, max: 10000 }),
            column: fc.integer({ min: 0, max: 1000 }),
            message: fc.string({ minLength: 1 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (errors: CompileError[]) => {
          const outputLines = errorsToOutputLines(errors)
          
          expect(outputLines.length).toBe(errors.length)
          for (let i = 0; i < errors.length; i++) {
            expect(outputLines[i].type).toBe('error')
            expect(outputLines[i].lineNumber).toBe(errors[i].line)
            expect(outputLines[i].content).toContain(errors[i].message)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty stderr gracefully', () => {
    const errors = parseCompilerOutput('')
    expect(errors.length).toBe(0)
  })

  it('should handle unstructured error messages', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => !s.match(/^\S+:\d+:\d+:/)),
        (message) => {
          const errors = parseCompilerOutput(message)
          
          // Should either parse it or return it as a single unstructured error
          if (errors.length > 0) {
            expect(errors[0].message).toBeTruthy()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Specific examples for common gcc/clang output formats
  it('should parse real gcc error output', () => {
    const gccOutput = `main.c:10:5: error: expected ';' before 'return'
main.c:15:10: warning: unused variable 'x' [-Wunused-variable]`
    
    const errors = parseCompilerOutput(gccOutput)
    
    expect(errors.length).toBe(2)
    expect(errors[0].line).toBe(10)
    expect(errors[0].column).toBe(5)
    expect(errors[0].message).toContain('error')
    expect(errors[1].line).toBe(15)
    expect(errors[1].column).toBe(10)
    expect(errors[1].message).toContain('warning')
  })

  it('should parse real clang error output', () => {
    const clangOutput = `test.c:5:3: error: use of undeclared identifier 'foo'
    foo();
    ^
1 error generated.`
    
    const errors = parseCompilerOutput(clangOutput)
    
    expect(errors.length).toBeGreaterThanOrEqual(1)
    expect(errors[0].line).toBe(5)
    expect(errors[0].column).toBe(3)
  })
})
