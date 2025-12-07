// 高性能 C 语言自动补全 - 使用 Trie 树和缓存优化

// Trie 树节点
interface TrieNode {
  children: Map<string, TrieNode>
  isEnd: boolean
  data?: CompletionData
}

interface CompletionData {
  label: string
  kind: 'keyword' | 'function' | 'snippet' | 'file'
  insertText: string
  detail?: string
}

// Trie 树实现 - O(m) 查找复杂度，m 为前缀长度
class Trie {
  private root: TrieNode = { children: new Map(), isEnd: false }

  insert(word: string, data: CompletionData): void {
    let node = this.root
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, { children: new Map(), isEnd: false })
      }
      node = node.children.get(char)!
    }
    node.isEnd = true
    node.data = data
  }

  // 前缀搜索 - 返回所有匹配的补全项
  searchPrefix(prefix: string, limit = 20): CompletionData[] {
    const results: CompletionData[] = []
    let node = this.root
    
    // 找到前缀节点
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) {
        return results
      }
      node = node.children.get(char)!
    }
    
    // DFS 收集所有子节点
    this.collectAll(node, results, limit)
    return results
  }

  private collectAll(node: TrieNode, results: CompletionData[], limit: number): void {
    if (results.length >= limit) return
    if (node.isEnd && node.data) {
      results.push(node.data)
    }
    for (const child of node.children.values()) {
      this.collectAll(child, results, limit)
    }
  }
}

// 预构建的 Trie 树（单例）
let keywordTrie: Trie | null = null
let functionTrie: Trie | null = null
let headerTrie: Trie | null = null

// C89 关键字 - 带括号的控制结构
const C_KEYWORDS: Array<{ name: string; snippet: string }> = [
  { name: 'auto', snippet: 'auto' },
  { name: 'break', snippet: 'break' },
  { name: 'case', snippet: 'case' },
  { name: 'char', snippet: 'char' },
  { name: 'const', snippet: 'const' },
  { name: 'continue', snippet: 'continue' },
  { name: 'default', snippet: 'default' },
  { name: 'do', snippet: 'do {\n\t$0\n} while ($1);' },
  { name: 'double', snippet: 'double' },
  { name: 'else', snippet: 'else' },
  { name: 'enum', snippet: 'enum' },
  { name: 'extern', snippet: 'extern' },
  { name: 'float', snippet: 'float' },
  { name: 'for', snippet: 'for ($1) {\n\t$0\n}' },
  { name: 'goto', snippet: 'goto' },
  { name: 'if', snippet: 'if ($1) {\n\t$0\n}' },
  { name: 'int', snippet: 'int' },
  { name: 'long', snippet: 'long' },
  { name: 'register', snippet: 'register' },
  { name: 'return', snippet: 'return' },
  { name: 'short', snippet: 'short' },
  { name: 'signed', snippet: 'signed' },
  { name: 'sizeof', snippet: 'sizeof($0)' },
  { name: 'static', snippet: 'static' },
  { name: 'struct', snippet: 'struct' },
  { name: 'switch', snippet: 'switch ($1) {\n\t$0\n}' },
  { name: 'typedef', snippet: 'typedef' },
  { name: 'union', snippet: 'union' },
  { name: 'unsigned', snippet: 'unsigned' },
  { name: 'void', snippet: 'void' },
  { name: 'volatile', snippet: 'volatile' },
  { name: 'while', snippet: 'while ($1) {\n\t$0\n}' }
]

// 常用函数 - 带括号，光标在括号内
const COMMON_FUNCTIONS: Array<{ name: string; detail: string; snippet: string }> = [
  { name: 'printf', detail: 'Print formatted output', snippet: 'printf($0)' },
  { name: 'scanf', detail: 'Read formatted input', snippet: 'scanf($0)' },
  { name: 'main', detail: 'Main function', snippet: 'main() {\n\t$0\n}' },
  { name: 'malloc', detail: 'Allocate memory', snippet: 'malloc($0)' },
  { name: 'free', detail: 'Free memory', snippet: 'free($0)' },
  { name: 'strlen', detail: 'String length', snippet: 'strlen($0)' },
  { name: 'strcpy', detail: 'Copy string', snippet: 'strcpy($0)' },
  { name: 'strcmp', detail: 'Compare strings', snippet: 'strcmp($0)' },
  { name: 'strcat', detail: 'Concatenate strings', snippet: 'strcat($0)' },
  { name: 'memset', detail: 'Fill memory', snippet: 'memset($0)' },
  { name: 'memcpy', detail: 'Copy memory', snippet: 'memcpy($0)' },
  { name: 'fopen', detail: 'Open file', snippet: 'fopen($0)' },
  { name: 'fclose', detail: 'Close file', snippet: 'fclose($0)' },
  { name: 'fprintf', detail: 'Print to file', snippet: 'fprintf($0)' },
  { name: 'fscanf', detail: 'Read from file', snippet: 'fscanf($0)' },
  { name: 'getchar', detail: 'Get character', snippet: 'getchar()' },
  { name: 'putchar', detail: 'Put character', snippet: 'putchar($0)' },
  { name: 'gets', detail: 'Get string (deprecated)', snippet: 'gets($0)' },
  { name: 'puts', detail: 'Put string', snippet: 'puts($0)' },
  { name: 'atoi', detail: 'String to int', snippet: 'atoi($0)' },
  { name: 'atof', detail: 'String to float', snippet: 'atof($0)' },
  { name: 'abs', detail: 'Absolute value', snippet: 'abs($0)' },
  { name: 'sqrt', detail: 'Square root', snippet: 'sqrt($0)' },
  { name: 'pow', detail: 'Power', snippet: 'pow($0)' },
  { name: 'rand', detail: 'Random number', snippet: 'rand()' },
  { name: 'srand', detail: 'Seed random', snippet: 'srand($0)' },
  { name: 'exit', detail: 'Exit program', snippet: 'exit($0)' }
]

// 常用头文件
const COMMON_HEADERS = [
  'stdio.h', 'stdlib.h', 'string.h', 'math.h', 'ctype.h', 'time.h',
  'limits.h', 'float.h', 'stddef.h', 'assert.h', 'errno.h', 'signal.h'
]

// 初始化 Trie 树
function initTries(): void {
  if (keywordTrie) return // 已初始化
  
  keywordTrie = new Trie()
  functionTrie = new Trie()
  headerTrie = new Trie()
  
  // 插入关键字
  for (const kw of C_KEYWORDS) {
    keywordTrie.insert(kw.name, { label: kw.name, kind: 'keyword', insertText: kw.snippet })
  }
  
  // 插入函数（带括号）
  for (const fn of COMMON_FUNCTIONS) {
    functionTrie.insert(fn.name, {
      label: fn.name,
      kind: 'function',
      insertText: fn.snippet,
      detail: fn.detail
    })
  }
  
  // 插入头文件
  for (const header of COMMON_HEADERS) {
    headerTrie.insert(header, { label: header, kind: 'file', insertText: header + '>' })
  }
}



// 预编译正则表达式
const INCLUDE_PATTERN = /#include\s*<(\w*)$/
const PREPROCESSOR_PATTERN = /^\s*#(\w*)$/

export function registerCCompletions(monaco: typeof import('monaco-editor')) {
  // 初始化 Trie 树
  initTries()
  
  monaco.languages.registerCompletionItemProvider('c', {
    triggerCharacters: ['#', '<', '.'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const lineContent = model.getLineContent(position.lineNumber)
      const textBeforeCursor = lineContent.substring(0, position.column - 1)
      const prefix = word.word.toLowerCase()

      // 检查是否在 #include < 后面
      const includeMatch = textBeforeCursor.match(INCLUDE_PATTERN)
      if (includeMatch) {
        const headerPrefix = includeMatch[1]
        const startCol = position.column - headerPrefix.length
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: startCol,
          endColumn: position.column
        }
        
        const headers = headerTrie!.searchPrefix(headerPrefix)
        return {
          suggestions: headers.map(h => ({
            label: h.label,
            kind: monaco.languages.CompletionItemKind.File,
            insertText: h.insertText,
            range
          }))
        }
      }

      // 检查是否在 # 后面（预处理指令）
      const preprocMatch = textBeforeCursor.match(PREPROCESSOR_PATTERN)
      if (preprocMatch) {
        const startCol = position.column - preprocMatch[1].length
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: startCol,
          endColumn: position.column
        }
        return {
          suggestions: [
            { label: 'include', insertText: 'include <', kind: monaco.languages.CompletionItemKind.Keyword, range, sortText: '0' },
            { label: 'define', insertText: 'define ', kind: monaco.languages.CompletionItemKind.Keyword, range, sortText: '1' },
            { label: 'ifdef', insertText: 'ifdef ', kind: monaco.languages.CompletionItemKind.Keyword, range, sortText: '2' },
            { label: 'ifndef', insertText: 'ifndef ', kind: monaco.languages.CompletionItemKind.Keyword, range, sortText: '3' },
            { label: 'endif', insertText: 'endif', kind: monaco.languages.CompletionItemKind.Keyword, range, sortText: '4' },
            { label: 'if', insertText: 'if ', kind: monaco.languages.CompletionItemKind.Keyword, range, sortText: '5' },
            { label: 'else', insertText: 'else', kind: monaco.languages.CompletionItemKind.Keyword, range, sortText: '6' },
            { label: 'elif', insertText: 'elif ', kind: monaco.languages.CompletionItemKind.Keyword, range, sortText: '7' },
            { label: 'pragma', insertText: 'pragma ', kind: monaco.languages.CompletionItemKind.Keyword, range, sortText: '8' }
          ]
        }
      }

      // 普通补全 - 使用 Trie 树快速搜索
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      const keywords = keywordTrie!.searchPrefix(prefix)
      const functions = functionTrie!.searchPrefix(prefix)

      return {
        suggestions: [
          ...keywords.map((kw, i) => ({
            label: kw.label,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            sortText: `0${i.toString().padStart(3, '0')}`,
            range
          })),
          ...functions.map((fn, i) => ({
            label: fn.label,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: fn.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: fn.detail,
            sortText: `1${i.toString().padStart(3, '0')}`,
            range
          }))
        ]
      }
    }
  })
}
