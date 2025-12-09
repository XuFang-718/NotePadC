import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { useEditorStore, extractFilename, clampSplitRatio } from './editorStore'

// Reset store before each test
beforeEach(() => {
  useEditorStore.setState({
    tabs: [],
    activeTabId: null,
    isCompiling: false,
    isRunning: false,
    output: [],
    splitRatio: 0.6
  })
})

/**
 * **Feature: c-code-editor, Property 1: Tab Creation Consistency**
 * **Validates: Requirements 1.1, 1.3, 6.1**
 * 
 * For any file path and content, when a file is opened, a new tab SHALL be created with:
 * - A unique ID
 * - The filename extracted from the path (or "Untitled.c" for new files)
 * - The correct file content
 * - isDirty set to false for opened files, true for new empty files
 */
describe('Property 1: Tab Creation Consistency', () => {
  it('should create tabs with unique IDs for any filepath and content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string(),
        (filepath, content) => {
          const store = useEditorStore.getState()
          const filename = extractFilename(filepath)
          
          const tabId = store.addTab({ filepath, content, filename })
          const state = useEditorStore.getState()
          const tab = state.tabs.find(t => t.id === tabId)
          
          expect(tab).toBeDefined()
          expect(tab!.id).toBe(tabId)
          expect(tab!.id.length).toBeGreaterThan(0)
          expect(tab!.content).toBe(content)
          expect(tab!.filepath).toBe(filepath)
          expect(tab!.isDirty).toBe(false) // Opened files are not dirty
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should create new tabs with isDirty=true when no filepath provided', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (content) => {
          useEditorStore.setState({ tabs: [], activeTabId: null })
          const store = useEditorStore.getState()
          
          const tabId = store.addTab({ content })
          const state = useEditorStore.getState()
          const tab = state.tabs.find(t => t.id === tabId)
          
          expect(tab).toBeDefined()
          expect(tab!.filepath).toBeNull()
          expect(tab!.filename).toBe('Untitled.c')
          expect(tab!.isDirty).toBe(true) // New files are dirty
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should extract filename correctly from any path', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1 }).filter(s => !s.includes('/') && !s.includes('\\')),
          { minLength: 1, maxLength: 10 }
        ),
        (pathParts) => {
          const filepath = pathParts.join('/')
          const expectedFilename = pathParts[pathParts.length - 1]
          expect(extractFilename(filepath)).toBe(expectedFilename)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should set activeTabId to newly created tab', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (filepath, content) => {
          useEditorStore.setState({ tabs: [], activeTabId: null })
          const store = useEditorStore.getState()
          
          const tabId = store.addTab({ filepath, content })
          const state = useEditorStore.getState()
          
          expect(state.activeTabId).toBe(tabId)
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: c-code-editor, Property 2: Dirty State Management**
 * **Validates: Requirements 1.4, 1.6**
 * 
 * For any tab with saved content, when the content is modified to a different value,
 * the isDirty flag SHALL be set to true. When the content is saved, isDirty SHALL be set to false.
 */
describe('Property 2: Dirty State Management', () => {
  it('should set isDirty=true when content is modified', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.string(),
        (filepath, originalContent, newContent) => {
          useEditorStore.setState({ tabs: [], activeTabId: null })
          const store = useEditorStore.getState()
          
          const tabId = store.addTab({ filepath, content: originalContent, filename: 'test.c' })
          
          // Mark as saved initially
          useEditorStore.getState().markTabDirty(tabId, false)
          let tab = useEditorStore.getState().tabs.find(t => t.id === tabId)
          expect(tab!.isDirty).toBe(false)
          
          // Modify content
          useEditorStore.getState().updateTabContent(tabId, newContent)
          tab = useEditorStore.getState().tabs.find(t => t.id === tabId)
          
          // isDirty should be true only if content actually changed
          const contentChanged = originalContent !== newContent
          expect(tab!.isDirty).toBe(contentChanged)
          expect(tab!.content).toBe(newContent)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should set isDirty=false when markTabDirty is called with false', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (content) => {
          useEditorStore.setState({ tabs: [], activeTabId: null })
          const store = useEditorStore.getState()
          
          const tabId = store.addTab({ content })
          let tab = useEditorStore.getState().tabs.find(t => t.id === tabId)
          expect(tab!.isDirty).toBe(true) // New file is dirty
          
          // Simulate save
          useEditorStore.getState().markTabDirty(tabId, false)
          tab = useEditorStore.getState().tabs.find(t => t.id === tabId)
          
          expect(tab!.isDirty).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: c-code-editor, Property 3: Tab Switching Consistency**
 * **Validates: Requirements 6.2, 6.3**
 * 
 * For any set of open tabs, when a tab is selected, activeTabId SHALL equal the selected tab's ID.
 * When a tab is closed, activeTabId SHALL be updated to an adjacent tab (or null if no tabs remain).
 */
describe('Property 3: Tab Switching Consistency', () => {
  it('should update activeTabId when setActiveTab is called', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 2, maxLength: 10 }),
        fc.nat(),
        (contents, selectIndex) => {
          useEditorStore.setState({ tabs: [], activeTabId: null })
          const store = useEditorStore.getState()
          
          // Create multiple tabs
          const tabIds = contents.map(content => store.addTab({ content }))
          
          // Select a random tab
          const targetIndex = selectIndex % tabIds.length
          const targetTabId = tabIds[targetIndex]
          
          useEditorStore.getState().setActiveTab(targetTabId)
          const state = useEditorStore.getState()
          
          expect(state.activeTabId).toBe(targetTabId)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should switch to adjacent tab when active tab is closed', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 2, maxLength: 10 }),
        fc.nat(),
        (contents, closeIndex) => {
          useEditorStore.setState({ tabs: [], activeTabId: null })
          const store = useEditorStore.getState()
          
          // Create multiple tabs
          const tabIds = contents.map(content => store.addTab({ content }))
          
          // Select and close a tab
          const targetIndex = closeIndex % tabIds.length
          const targetTabId = tabIds[targetIndex]
          
          useEditorStore.getState().setActiveTab(targetTabId)
          useEditorStore.getState().removeTab(targetTabId)
          
          const state = useEditorStore.getState()
          
          // Should have switched to adjacent tab
          expect(state.tabs.length).toBe(tabIds.length - 1)
          if (state.tabs.length > 0) {
            expect(state.activeTabId).not.toBeNull()
            expect(state.tabs.some(t => t.id === state.activeTabId)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should set activeTabId to null when last tab is closed', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (content) => {
          useEditorStore.setState({ tabs: [], activeTabId: null })
          const store = useEditorStore.getState()
          
          const tabId = store.addTab({ content })
          expect(useEditorStore.getState().activeTabId).toBe(tabId)
          
          useEditorStore.getState().removeTab(tabId)
          const state = useEditorStore.getState()
          
          expect(state.tabs.length).toBe(0)
          expect(state.activeTabId).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: c-code-editor, Property 4: Unsaved Changes Detection**
 * **Validates: Requirements 6.4**
 * 
 * For any tab, the system SHALL correctly identify whether the tab has unsaved changes
 * by checking the isDirty flag.
 */
describe('Property 4: Unsaved Changes Detection', () => {
  it('should correctly detect unsaved changes via hasUnsavedChanges', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.boolean(),
        (content, shouldBeDirty) => {
          useEditorStore.setState({ tabs: [], activeTabId: null })
          const store = useEditorStore.getState()
          
          const tabId = store.addTab({ content, filepath: '/test/file.c', filename: 'file.c' })
          useEditorStore.getState().markTabDirty(tabId, shouldBeDirty)
          
          const hasChanges = useEditorStore.getState().hasUnsavedChanges(tabId)
          
          expect(hasChanges).toBe(shouldBeDirty)
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: c-code-editor, Property 5: Compilation State Transitions**
 * **Validates: Requirements 4.2, 4.7**
 * 
 * For any compilation request, the state SHALL transition correctly:
 * - isCompiling: false → true (when compile starts)
 * - isCompiling: true → false (when compile completes)
 * - isRunning: false → true (when execution starts)
 * - isRunning: true → false (when execution completes or is stopped)
 */
describe('Property 5: Compilation State Transitions', () => {
  it('should correctly transition isCompiling state', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (transitions) => {
          useEditorStore.setState({ isCompiling: false, isRunning: false })
          
          for (const shouldCompile of transitions) {
            useEditorStore.getState().setCompiling(shouldCompile)
            expect(useEditorStore.getState().isCompiling).toBe(shouldCompile)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly transition isRunning state', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (transitions) => {
          useEditorStore.setState({ isCompiling: false, isRunning: false })
          
          for (const shouldRun of transitions) {
            useEditorStore.getState().setRunning(shouldRun)
            expect(useEditorStore.getState().isRunning).toBe(shouldRun)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should allow independent state transitions for compiling and running', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (compiling, running) => {
          useEditorStore.setState({ isCompiling: false, isRunning: false })
          
          useEditorStore.getState().setCompiling(compiling)
          useEditorStore.getState().setRunning(running)
          
          const state = useEditorStore.getState()
          expect(state.isCompiling).toBe(compiling)
          expect(state.isRunning).toBe(running)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: c-code-editor, Property 7: Output Accumulation**
 * **Validates: Requirements 4.3, 4.4**
 * 
 * For any sequence of output lines, the output array SHALL contain all lines
 * in the order they were received, and clearOutput SHALL reset the array to empty.
 */
describe('Property 7: Output Accumulation', () => {
  it('should accumulate output lines in order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('info', 'error', 'output', 'input') as fc.Arbitrary<'info' | 'error' | 'output' | 'input'>,
            content: fc.string(),
            lineNumber: fc.option(fc.nat(), { nil: undefined })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (lines) => {
          useEditorStore.setState({ output: [] })
          
          for (const line of lines) {
            useEditorStore.getState().appendOutput(line)
          }
          
          const state = useEditorStore.getState()
          expect(state.output.length).toBe(lines.length)
          
          for (let i = 0; i < lines.length; i++) {
            expect(state.output[i].type).toBe(lines[i].type)
            expect(state.output[i].content).toBe(lines[i].content)
            expect(state.output[i].timestamp).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should clear all output when clearOutput is called', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('info', 'error', 'output', 'input') as fc.Arbitrary<'info' | 'error' | 'output' | 'input'>,
            content: fc.string()
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (lines) => {
          useEditorStore.setState({ output: [] })
          
          for (const line of lines) {
            useEditorStore.getState().appendOutput(line)
          }
          
          expect(useEditorStore.getState().output.length).toBe(lines.length)
          
          useEditorStore.getState().clearOutput()
          
          expect(useEditorStore.getState().output.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: c-code-editor, Property 8: Split Ratio Bounds**
 * **Validates: Requirements 4.8**
 * 
 * For any resize operation, the splitRatio SHALL remain within valid bounds (0.2 to 0.8)
 * to ensure both panels remain visible.
 */
describe('Property 8: Split Ratio Bounds', () => {
  it('should clamp splitRatio within bounds for any input', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10, max: 10, noNaN: true }),
        (ratio) => {
          useEditorStore.setState({ splitRatio: 0.5 })
          
          useEditorStore.getState().setSplitRatio(ratio)
          const state = useEditorStore.getState()
          
          expect(state.splitRatio).toBeGreaterThanOrEqual(0.2)
          expect(state.splitRatio).toBeLessThanOrEqual(0.8)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve valid ratios within bounds', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.2, max: 0.8, noNaN: true }),
        (ratio) => {
          // Set initial value far from target to ensure update happens
          useEditorStore.setState({ splitRatio: ratio < 0.5 ? 0.8 : 0.2 })
          
          useEditorStore.getState().setSplitRatio(ratio)
          const state = useEditorStore.getState()
          
          // Allow for small optimization threshold (0.001)
          expect(state.splitRatio).toBeCloseTo(ratio, 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should clamp values below minimum to 0.2', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 0.19, noNaN: true }),
        (ratio) => {
          useEditorStore.setState({ splitRatio: 0.5 })
          
          useEditorStore.getState().setSplitRatio(ratio)
          const state = useEditorStore.getState()
          
          expect(state.splitRatio).toBe(0.2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should clamp values above maximum to 0.8', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.81, max: 100, noNaN: true }),
        (ratio) => {
          useEditorStore.setState({ splitRatio: 0.5 })
          
          useEditorStore.getState().setSplitRatio(ratio)
          const state = useEditorStore.getState()
          
          expect(state.splitRatio).toBe(0.8)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('clampSplitRatio helper should work correctly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 100, noNaN: true }),
        (ratio) => {
          const clamped = clampSplitRatio(ratio)
          
          expect(clamped).toBeGreaterThanOrEqual(0.2)
          expect(clamped).toBeLessThanOrEqual(0.8)
          
          if (ratio >= 0.2 && ratio <= 0.8) {
            expect(clamped).toBeCloseTo(ratio, 5)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: c-code-editor, Property 9: File Drop Creates Tab**
 * **Validates: Requirements 8.4**
 * 
 * For any valid file path dropped onto the editor, a new tab SHALL be created
 * with the file's content and the filename extracted from the path.
 */
describe('Property 9: File Drop Creates Tab', () => {
  it('should create tab with correct filename from dropped file path', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1 }).filter(s => !s.includes('/') && !s.includes('\\')),
          { minLength: 1, maxLength: 5 }
        ),
        fc.string(),
        (pathParts, content) => {
          useEditorStore.setState({ tabs: [], activeTabId: null })
          const store = useEditorStore.getState()
          
          // Simulate file drop by adding tab with filepath
          const filename = pathParts[pathParts.length - 1] + '.c'
          const filepath = '/' + pathParts.join('/') + '.c'
          
          const tabId = store.addTab({
            filepath,
            filename,
            content,
            isDirty: false
          })
          
          const state = useEditorStore.getState()
          const tab = state.tabs.find(t => t.id === tabId)
          
          expect(tab).toBeDefined()
          expect(tab!.filepath).toBe(filepath)
          expect(tab!.filename).toBe(filename)
          expect(tab!.content).toBe(content)
          expect(tab!.isDirty).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should extract filename correctly using extractFilename helper', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1 }).filter(s => !s.includes('/') && !s.includes('\\')),
          { minLength: 1, maxLength: 5 }
        ),
        (pathParts) => {
          const filepath = '/' + pathParts.join('/') + '.c'
          const expectedFilename = pathParts[pathParts.length - 1] + '.c'
          
          expect(extractFilename(filepath)).toBe(expectedFilename)
        }
      ),
      { numRuns: 100 }
    )
  })
})
