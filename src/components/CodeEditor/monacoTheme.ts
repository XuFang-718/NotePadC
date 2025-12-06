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
    'editorBracketMatch.background': '#007AFF1A',
    'editorBracketMatch.border': '#007AFF',
    'editorIndentGuide.background': '#E5E5E5',
    'editorIndentGuide.activeBackground': '#C7C7CC',
    'scrollbarSlider.background': '#86868B33',
    'scrollbarSlider.hoverBackground': '#86868B66',
    'scrollbarSlider.activeBackground': '#86868B99'
  }
}

// 暗色主题
export const darkTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
    { token: 'keyword.control', foreground: 'C586C0', fontStyle: 'bold' },
    { token: 'keyword.operator', foreground: '569CD6' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'string.escape', foreground: 'D7BA7D' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'number.hex', foreground: 'B5CEA8' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'type.identifier', foreground: '4EC9B0' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'constant', foreground: '4FC1FF' },
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'delimiter', foreground: 'D4D4D4' },
    { token: 'delimiter.bracket', foreground: 'FFD700' },
    { token: 'preprocessor', foreground: 'C586C0' },
    { token: 'macro', foreground: 'C586C0' }
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editor.lineHighlightBackground': '#2D2D2D',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#3A3D41',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#C6C6C6',
    'editorGutter.background': '#1E1E1E',
    'editorCursor.foreground': '#AEAFAD',
    'editor.findMatchBackground': '#515C6A',
    'editor.findMatchHighlightBackground': '#EA5C0055',
    'editorBracketMatch.background': '#0064001A',
    'editorBracketMatch.border': '#888888',
    'editorIndentGuide.background': '#404040',
    'editorIndentGuide.activeBackground': '#707070',
    'scrollbarSlider.background': '#79797966',
    'scrollbarSlider.hoverBackground': '#646464B3',
    'scrollbarSlider.activeBackground': '#BFBFBF66'
  }
}

export const THEME_NAME = 'blue-white-theme'
export const DARK_THEME_NAME = 'dark-theme'
