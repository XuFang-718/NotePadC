import type { editor } from 'monaco-editor'

// 亮色主题
export const blueWhiteTheme: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '86868B', fontStyle: 'italic' },
    { token: 'keyword', foreground: '007AFF', fontStyle: 'bold' },
    { token: 'keyword.control', foreground: '007AFF', fontStyle: 'bold' },
    { token: 'keyword.operator', foreground: '007AFF' },
    { token: 'string', foreground: 'D12F1B' },
    { token: 'string.escape', foreground: 'D12F1B' },
    { token: 'number', foreground: '1C00CF' },
    { token: 'number.hex', foreground: '1C00CF' },
    { token: 'type', foreground: '5856D6' },
    { token: 'type.identifier', foreground: '5856D6' },
    { token: 'function', foreground: '326D74' },
    { token: 'variable', foreground: '1D1D1F' },
    { token: 'constant', foreground: '1C00CF' },
    { token: 'operator', foreground: '1D1D1F' },
    { token: 'delimiter', foreground: '1D1D1F' },
    { token: 'delimiter.bracket', foreground: '1D1D1F' },
    { token: 'preprocessor', foreground: '643820' },
    { token: 'macro', foreground: '643820' }
  ],
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#1D1D1F',
    'editor.lineHighlightBackground': '#F5F5F7',
    'editor.selectionBackground': '#007AFF33',
    'editor.inactiveSelectionBackground': '#007AFF1A',
    'editorLineNumber.foreground': '#86868B',
    'editorLineNumber.activeForeground': '#007AFF',
    'editorGutter.background': '#F5F5F7',
    'editorCursor.foreground': '#007AFF',
    'editor.findMatchBackground': '#FFD60A66',
    'editor.findMatchHighlightBackground': '#FFD60A33',
    'editorBracketMatch.background': '#007AFF0D',
    'editorBracketMatch.border': '#007AFF80',
    'editorIndentGuide.background': '#E5E5E5',
    'editorIndentGuide.activeBackground': '#C7C7CC',
    'scrollbarSlider.background': '#86868B33',
    'scrollbarSlider.hoverBackground': '#86868B66',
    'scrollbarSlider.activeBackground': '#86868B99'
  }
}

// Kiro Dark Theme - 匹配Kiro暗色主题
export const darkTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Comments - 绿色斜体
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'comment.line', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'comment.block', foreground: '6A9955', fontStyle: 'italic' },
    
    // Keywords - 蓝色
    { token: 'keyword', foreground: '569CD6' },
    { token: 'keyword.control', foreground: 'C586C0' },
    { token: 'keyword.operator', foreground: '569CD6' },
    { token: 'keyword.other', foreground: '569CD6' },
    
    // Storage/Types - 蓝色
    { token: 'storage', foreground: '569CD6' },
    { token: 'storage.type', foreground: '569CD6' },
    { token: 'storage.modifier', foreground: '569CD6' },
    
    // Strings - 橙色
    { token: 'string', foreground: 'CE9178' },
    { token: 'string.escape', foreground: 'D7BA7D' },
    { token: 'string.quoted', foreground: 'CE9178' },
    
    // Numbers - 浅绿色
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'number.hex', foreground: 'B5CEA8' },
    { token: 'number.float', foreground: 'B5CEA8' },
    { token: 'constant.numeric', foreground: 'B5CEA8' },
    
    // Types - 青色
    { token: 'type', foreground: '4EC9B0' },
    { token: 'type.identifier', foreground: '4EC9B0' },
    { token: 'entity.name.type', foreground: '4EC9B0' },
    { token: 'support.type', foreground: '4EC9B0' },
    
    // Functions - 黄色
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'entity.name.function', foreground: 'DCDCAA' },
    { token: 'support.function', foreground: 'DCDCAA' },
    
    // Variables - 浅蓝色
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'variable.other', foreground: '9CDCFE' },
    { token: 'variable.parameter', foreground: '9CDCFE' },
    
    // Constants - 亮蓝色
    { token: 'constant', foreground: '4FC1FF' },
    { token: 'constant.language', foreground: '569CD6' },
    { token: 'constant.character', foreground: 'D7BA7D' },
    
    // Operators & Delimiters - 灰白色
    { token: 'operator', foreground: 'E1E1E1' },
    { token: 'delimiter', foreground: 'E1E1E1' },
    { token: 'delimiter.bracket', foreground: 'E1E1E1' },
    { token: 'punctuation', foreground: 'E1E1E1' },
    
    // Preprocessor - 紫色
    { token: 'preprocessor', foreground: 'C586C0' },
    { token: 'meta.preprocessor', foreground: 'C586C0' },
    { token: 'macro', foreground: 'C586C0' },
    
    // Invalid
    { token: 'invalid', foreground: 'F14C4C' }
  ],
  colors: {
    // Editor Background & Foreground - Kiro colors
    'editor.background': '#181818',
    'editor.foreground': '#E1E1E1',
    
    // Line Highlight
    'editor.lineHighlightBackground': '#1F1F1F',
    'editor.lineHighlightBorder': '#1F1F1F',
    
    // Selection
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#2D2D2D',
    'editor.selectionHighlightBackground': '#ADD6FF26',
    
    // Line Numbers - Kiro colors
    'editorLineNumber.foreground': '#6E6E6E',
    'editorLineNumber.activeForeground': '#E1E1E1',
    
    // Gutter
    'editorGutter.background': '#181818',
    'editorGutter.addedBackground': '#587C0C',
    'editorGutter.modifiedBackground': '#0C7D9D',
    'editorGutter.deletedBackground': '#94151B',
    
    // Cursor
    'editorCursor.foreground': '#E1E1E1',
    'editorCursor.background': '#000000',
    
    // Find Match
    'editor.findMatchBackground': '#515C6A',
    'editor.findMatchHighlightBackground': '#EA5C0055',
    'editor.findMatchBorder': '#74879F',
    
    // Bracket Match
    'editorBracketMatch.background': '#0064001A',
    'editorBracketMatch.border': '#6E6E6E',
    
    // Indent Guides - Kiro colors
    'editorIndentGuide.background': '#2D2D2D',
    'editorIndentGuide.activeBackground': '#4D4D4D',
    
    // Whitespace
    'editorWhitespace.foreground': '#2D2D2D',
    
    // Scrollbar - Kiro colors
    'scrollbarSlider.background': '#6E6E6E4D',
    'scrollbarSlider.hoverBackground': '#6E6E6E80',
    'scrollbarSlider.activeBackground': '#6E6E6E99',
    
    // Minimap
    'minimap.background': '#181818',
    'minimapSlider.background': '#6E6E6E33',
    'minimapSlider.hoverBackground': '#6E6E6E59',
    'minimapSlider.activeBackground': '#6E6E6E33',
    
    // Overview Ruler
    'editorOverviewRuler.border': '#2D2D2D',
    
    // Widget - Kiro colors
    'editorWidget.background': '#1F1F1F',
    'editorWidget.border': '#2D2D2D',
    
    // Suggest Widget - Kiro colors
    'editorSuggestWidget.background': '#1F1F1F',
    'editorSuggestWidget.border': '#2D2D2D',
    'editorSuggestWidget.foreground': '#E1E1E1',
    'editorSuggestWidget.selectedBackground': '#094771',
    'editorSuggestWidget.highlightForeground': '#007ACC'
  }
}

export const THEME_NAME = 'blue-white-theme'
export const DARK_THEME_NAME = 'dark-theme'
