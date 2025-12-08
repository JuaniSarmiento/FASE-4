/**
 * AI Companion Panel
 * Panel derecho con 3 modos: Tutor, Juez, Simulador
 */

import * as React from "react"
import * as Tabs from "@radix-ui/react-tabs"
import { MessageCircle, Scale, Users, Loader2, Send } from "lucide-react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import { cn } from "@/lib/utils"

type AIMode = "tutor" | "judge" | "simulator"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isThinking?: boolean
}

interface AICompanionPanelProps {
  mode: AIMode
  onModeChange: (mode: AIMode) => void
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
}

export function AICompanionPanel({
  mode,
  onModeChange,
  messages,
  onSendMessage,
  isLoading = false,
}: AICompanionPanelProps) {
  const [input, setInput] = React.useState("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput("")
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs Header */}
      <Tabs.Root value={mode} onValueChange={(v) => onModeChange(v as AIMode)}>
        <Tabs.List className="flex border-b border-gray-800 bg-[#0d1117]">
          <TabTrigger value="tutor" icon={<MessageCircle className="w-4 h-4" />}>
            Tutor
          </TabTrigger>
          <TabTrigger value="judge" icon={<Scale className="w-4 h-4" />}>
            Juez
          </TabTrigger>
          <TabTrigger value="simulator" icon={<Users className="w-4 h-4" />}>
            Simulador
          </TabTrigger>
        </Tabs.List>

        {/* Tutor Mode */}
        <Tabs.Content value="tutor" className="flex-1 flex flex-col h-[calc(100%-48px)]">
          <ChatInterface
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            placeholder="Pregunta al tutor..."
          />
        </Tabs.Content>

        {/* Judge Mode */}
        <Tabs.Content value="judge" className="flex-1 overflow-auto p-4">
          <JudgeInterface />
        </Tabs.Content>

        {/* Simulator Mode */}
        <Tabs.Content value="simulator" className="flex-1 overflow-auto p-4">
          <SimulatorInterface />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

function TabTrigger({
  value,
  icon,
  children,
}: {
  value: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
        "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50",
        "data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400"
      )}
    >
      {icon}
      {children}
    </Tabs.Trigger>
  )
}

function ChatInterface({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  messagesEndRef,
  placeholder,
}: {
  messages: Message[]
  input: string
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
  placeholder: string
}) {
  return (
    <>
      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <p className="text-center">
              {placeholder}
              <br />
              <span className="text-sm">Puedo ayudarte con pistas y guía.</span>
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))
        )}
        {isLoading && <ThinkingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={onSubmit} className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg",
              "text-gray-100 placeholder:text-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </>
  )
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-100 border border-gray-700"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analizando tu código...</span>
        </div>
      </div>
    </div>
  )
}

function JudgeInterface() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-100">Evaluación</h3>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-400 text-sm">
          Entrega tu solución para recibir feedback del evaluador.
        </p>
      </div>
    </div>
  )
}

function SimulatorInterface() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-100">Simulador</h3>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-400 text-sm">
          Interfaz de roleplay profesional próximamente.
        </p>
      </div>
    </div>
  )
}
