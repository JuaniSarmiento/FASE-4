/**
 * Workbench Layout - The Heart of the Application
 * Layout de 3 columnas resizables tipo VS Code
 * 
 * Estructura:
 * - Panel Izquierdo (20%): Contexto (Consigna, Historial)
 * - Panel Central (50%): Editor de Código + Terminal
 * - Panel Derecho (30%): AI Companion (Tutor, Juez, Simulador)
 */

import * as React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

interface WorkbenchLayoutProps {
  leftPanel: React.ReactNode
  centerPanel: React.ReactNode
  rightPanel: React.ReactNode
}

export function WorkbenchLayout({
  leftPanel,
  centerPanel,
  rightPanel,
}: WorkbenchLayoutProps) {
  return (
    <div className="h-screen w-full bg-[#0d1117] text-gray-100">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Panel Izquierdo: Contexto */}
        <Panel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          className="bg-[#0d1117]"
        >
          <div className="h-full border-r border-gray-800">
            {leftPanel}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-600 transition-colors" />

        {/* Panel Central: Editor */}
        <Panel
          defaultSize={50}
          minSize={30}
          className="bg-[#161b22]"
        >
          {centerPanel}
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-600 transition-colors" />

        {/* Panel Derecho: IA */}
        <Panel
          defaultSize={30}
          minSize={20}
          maxSize={40}
          className="bg-[#0d1117]"
        >
          <div className="h-full border-l border-gray-800">
            {rightPanel}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}

/**
 * Panel de Contexto (Izquierda)
 */
interface ContextPanelProps {
  children: React.ReactNode
}

export function ContextPanel({ children }: ContextPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {children}
    </div>
  )
}

/**
 * Panel del Editor (Centro)
 */
interface EditorPanelProps {
  children: React.ReactNode
}

export function EditorPanel({ children }: EditorPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {children}
    </div>
  )
}

/**
 * Panel de IA (Derecha)
 */
interface AIPanelProps {
  children: React.ReactNode
}

export function AIPanel({ children }: AIPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {children}
    </div>
  )
}
