/**
 * Monaco Code Editor Component
 * Editor de código profesional (el mismo que usa VS Code)
 */

import * as React from "react"
import Editor, { Monaco } from "@monaco-editor/react"
import { Loader2 } from "lucide-react"

interface MonacoEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language?: string
  readOnly?: boolean
  height?: string
}

export function MonacoEditor({
  value,
  onChange,
  language = "python",
  readOnly = false,
  height = "100%",
}: MonacoEditorProps) {
  const editorRef = React.useRef<any>(null)

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    editorRef.current = editor

    // Configurar tema oscuro personalizado (Dracula-like)
    monaco.editor.defineTheme("ai-native-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6272a4", fontStyle: "italic" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "string", foreground: "f1fa8c" },
        { token: "number", foreground: "bd93f9" },
        { token: "function", foreground: "50fa7b" },
      ],
      colors: {
        "editor.background": "#161b22",
        "editor.foreground": "#c9d1d9",
        "editor.lineHighlightBackground": "#1f2428",
        "editor.selectionBackground": "#3392FF44",
        "editorCursor.foreground": "#c9d1d9",
        "editorLineNumber.foreground": "#484f58",
        "editorLineNumber.activeForeground": "#c9d1d9",
      },
    })

    monaco.editor.setTheme("ai-native-dark")
  }

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      loading={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
        lineNumbers: "on",
        readOnly,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: "on",
        formatOnPaste: true,
        formatOnType: true,
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
      }}
    />
  )
}

/**
 * Terminal Output Component
 * Muestra stdout/stderr de la ejecución
 */
interface TerminalOutputProps {
  output: string
  isRunning?: boolean
}

export function TerminalOutput({ output, isRunning = false }: TerminalOutputProps) {
  const terminalRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll al final cuando hay nuevo output
  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className="h-full bg-[#0d1117] border-t border-gray-800">
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400">TERMINAL</span>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Ejecutando...
          </div>
        )}
      </div>
      <div
        ref={terminalRef}
        className="p-3 overflow-auto h-[calc(100%-40px)] font-mono text-sm text-gray-300"
      >
        {output ? (
          <pre className="whitespace-pre-wrap">{output}</pre>
        ) : (
          <p className="text-gray-600 italic">
            Presiona "Ejecutar" para ver la salida del código...
          </p>
        )}
      </div>
    </div>
  )
}
