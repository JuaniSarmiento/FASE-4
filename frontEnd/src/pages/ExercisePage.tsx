/**
 * Ejemplo de Página Completa usando Workbench
 * Vista de resolución de ejercicios (/exercises/:id)
 */

import * as React from "react"
import { useParams } from "react-router-dom"
import { WorkbenchLayout, ContextPanel, EditorPanel, AIPanel } from "@/components/layout/WorkbenchLayout"
import { MonacoEditor, TerminalOutput } from "@/components/editor/MonacoEditor"
import { AICompanionPanel } from "@/components/ai/AICompanionPanel"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { Play, Send, BookOpen, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/toast"

type AIMode = "tutor" | "judge" | "simulator"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isThinking?: boolean
}

export function ExercisePage() {
  const { id } = useParams()
  const [code, setCode] = React.useState("")
  const [output, setOutput] = React.useState("")
  const [isRunning, setIsRunning] = React.useState(false)
  const [aiMode, setAIMode] = React.useState<AIMode>("tutor")
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isAILoading, setIsAILoading] = React.useState(false)
  const [isLoadingExercise, setIsLoadingExercise] = React.useState(true)

  // Simular carga inicial
  React.useEffect(() => {
    setTimeout(() => {
      setCode(`# Ejercicio ${id}: Suma de Números
# Implementa una función que sume dos números

def sumar(a, b):
    # Tu código aquí
    pass

# Tests
print(sumar(2, 3))  # Debe retornar 5
print(sumar(-1, 1))  # Debe retornar 0
`)
      setIsLoadingExercise(false)
    }, 1500)
  }, [id])

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput("")
    
    showToast({
      title: "Ejecutando código...",
      description: "El código se está ejecutando en Docker",
      variant: "info"
    })

    // Simular ejecución
    setTimeout(() => {
      setOutput(`Ejecutando tests...
  
> python solution.py
5
0

✓ Tests pasados: 2/2
✓ Tiempo de ejecución: 0.12s`)
      setIsRunning(false)
      
      showToast({
        title: "✓ Ejecución exitosa",
        description: "Todos los tests pasaron",
        variant: "success"
      })
    }, 2000)
  }

  const handleSubmit = async () => {
    showToast({
      title: "Entregando solución...",
      description: "El Evaluador está analizando tu código",
      variant: "info"
    })

    // Simular evaluación
    setTimeout(() => {
      showToast({
        title: "✓ Solución entregada",
        description: "Score: 95/100 - Revisa el panel del Juez",
        variant: "success"
      })
      setAIMode("judge")
    }, 3000)
  }

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsAILoading(true)

    // Simular respuesta del tutor
    setTimeout(() => {
      const aiMessage: Message = {
        role: "assistant",
        content: `Excelente pregunta. Para resolver este ejercicio, considerá:

1. **Descomponer el problema**: ¿Qué operación básica necesitás?
2. **Implementación**: La función \`sumar\` debería tomar dos parámetros
3. **Retornar el resultado**: Usá \`return\` en vez de \`print\`

**Pista**: En Python, la suma es tan simple como \`a + b\`

¿Tiene sentido? ¿Querés que profundice en algún punto?`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsAILoading(false)
    }, 2000)
  }

  const handlePasteDetection = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text')
    
    // Detectar pegado masivo (>100 caracteres)
    if (pastedText.length > 100) {
      showToast({
        title: "⚠️ Inserción masiva detectada",
        description: "Esto será analizado por el motor de integridad",
        variant: "warning",
        duration: 7000
      })
    }
  }

  if (isLoadingExercise) {
    return <ExercisePageSkeleton />
  }

  return (
    <WorkbenchLayout
      leftPanel={
        <ContextPanel>
          <LeftPanelContent exerciseId={id || "1"} />
        </ContextPanel>
      }
      centerPanel={
        <EditorPanel>
          <CenterPanelContent
            code={code}
            onCodeChange={(value) => setCode(value || '')}
            output={output}
            isRunning={isRunning}
            onRun={handleRunCode}
            onSubmit={handleSubmit}
            onPaste={handlePasteDetection}
          />
        </EditorPanel>
      }
      rightPanel={
        <AIPanel>
          <AICompanionPanel
            mode={aiMode}
            onModeChange={setAIMode}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isAILoading}
          />
        </AIPanel>
      }
    />
  )
}

function LeftPanelContent({ exerciseId }: { exerciseId: string }) {
  const [activeTab, setActiveTab] = React.useState<"consigna" | "historial">("consigna")

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab("consigna")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "consigna"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <BookOpen className="inline w-4 h-4 mr-2" />
          Consigna
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "historial"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Clock className="inline w-4 h-4 mr-2" />
          Historial
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "consigna" ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <h2 className="text-lg font-bold text-gray-100">Ejercicio {exerciseId}</h2>
            <h3 className="text-md font-semibold text-blue-400">Suma de Números</h3>
            
            <p className="text-gray-300">
              Implementa una función llamada <code>sumar</code> que:
            </p>
            
            <ul className="text-gray-300">
              <li>Reciba dos parámetros numéricos</li>
              <li>Retorne la suma de ambos</li>
              <li>Funcione con números positivos y negativos</li>
            </ul>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-200">
                💡 <strong>Tip:</strong> Asegurate de usar <code>return</code> en vez de <code>print</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <HistoryItem
              date="Hace 2 horas"
              score={85}
              status="Completado"
            />
            <HistoryItem
              date="Hace 5 horas"
              score={70}
              status="Intentado"
            />
          </div>
        )}
      </div>

      {/* Panic Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => showToast({
            title: "Tutor activado",
            description: "Cambiando al modo asistencia...",
            variant: "info"
          })}
          className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-medium"
        >
          🆘 Estoy Trabado
        </button>
      </div>
    </div>
  )
}

function CenterPanelContent({
  code,
  onCodeChange,
  output,
  isRunning,
  onRun,
  onSubmit,
  onPaste,
}: {
  code: string
  onCodeChange: (value: string | undefined) => void
  output: string
  isRunning: boolean
  onRun: () => void
  onSubmit: () => void
  onPaste: (e: React.ClipboardEvent) => void
}) {
  return (
    <PanelGroup direction="vertical">
      {/* Editor */}
      <Panel defaultSize={70} minSize={30}>
        <div className="h-full flex flex-col">
          {/* Toolbar */}
          <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between bg-[#0d1117]">
            <span className="text-xs font-semibold text-gray-400">solution.py</span>
            <div className="flex gap-2">
              <button
                onClick={onRun}
                disabled={isRunning}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Ejecutar
              </button>
              <button
                onClick={onSubmit}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Entregar
              </button>
            </div>
          </div>
          
          {/* Monaco Editor */}
          <div className="flex-1" onPaste={onPaste}>
            <MonacoEditor
              value={code}
              onChange={onCodeChange}
              language="python"
            />
          </div>
        </div>
      </Panel>

      <PanelResizeHandle className="h-1 bg-gray-800 hover:bg-blue-600 transition-colors" />

      {/* Terminal */}
      <Panel defaultSize={30} minSize={20}>
        <TerminalOutput output={output} isRunning={isRunning} />
      </Panel>
    </PanelGroup>
  )
}

function HistoryItem({
  date,
  score,
  status,
}: {
  date: string
  score: number
  status: string
}) {
  const getColor = (s: number) => {
    if (s >= 90) return "text-green-400"
    if (s >= 70) return "text-blue-400"
    return "text-yellow-400"
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{date}</span>
        <span className={`text-lg font-bold ${getColor(score)}`}>{score}</span>
      </div>
      <p className="text-xs text-gray-500">{status}</p>
    </div>
  )
}

function ExercisePageSkeleton() {
  return (
    <div className="h-screen bg-[#0d1117] flex">
      <div className="w-1/5 border-r border-gray-800 p-4">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="w-1/3 border-l border-gray-800 p-4">
        <Skeleton className="h-8 w-2/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
