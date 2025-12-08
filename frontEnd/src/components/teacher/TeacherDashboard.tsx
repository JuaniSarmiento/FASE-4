/**
 * Teacher Dashboard - Torre de Control
 * Vista para docentes con métricas, riesgos y monitoreo en vivo
 */

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { AlertTriangle, Activity, TrendingUp, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentRisk {
  id: string
  name: string
  plagiarismRisk: number
  aiDependency: number
  performance: number
  lastActivity: Date
}

interface ActivityHeatmapData {
  day: string
  count: number
}

export function TeacherDashboard() {
  const [students, setStudents] = React.useState<StudentRisk[]>([])
  const [activityData, setActivityData] = React.useState<ActivityHeatmapData[]>([])

  // TODO: Fetch real data from API
  React.useEffect(() => {
    // Mock data
    setStudents([
      {
        id: "1",
        name: "Juan Pérez",
        plagiarismRisk: 85,
        aiDependency: 65,
        performance: 72,
        lastActivity: new Date(),
      },
      {
        id: "2",
        name: "María González",
        plagiarismRisk: 20,
        aiDependency: 45,
        performance: 88,
        lastActivity: new Date(),
      },
    ])

    setActivityData([
      { day: "Lun", count: 12 },
      { day: "Mar", count: 15 },
      { day: "Mié", count: 8 },
      { day: "Jue", count: 18 },
      { day: "Vie", count: 10 },
    ])
  }, [])

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard del Docente</h1>
            <p className="text-gray-400 mt-1">Torre de Control - AI Native</p>
          </div>
          <div className="flex gap-3">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Estudiantes Activos"
              value="24"
              trend="+3"
            />
            <StatCard
              icon={<Activity className="w-5 h-5" />}
              label="Sesiones Hoy"
              value="48"
              trend="+12%"
            />
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Actividad de la Semana
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Matrix */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Matriz de Riesgo
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                    Estudiante
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                    Riesgo Plagio
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                    Dependencia IA
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                    Performance
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                    Última Actividad
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium">{student.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={student.plagiarismRisk} />
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={student.aiDependency} />
                    </td>
                    <td className="py-3 px-4">
                      <PerformanceBadge score={student.performance} />
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-400">
                      {formatRelativeTime(student.lastActivity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actividad en Vivo</h2>
          <div className="space-y-3">
            <LiveFeedItem
              student="Juan Pérez"
              action="completó TP1"
              timestamp={new Date()}
              type="success"
            />
            <LiveFeedItem
              student="María González"
              action="disparó alerta de Gobernanza"
              timestamp={new Date()}
              type="warning"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-[180px]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-xs text-green-400 mt-1">{trend}</p>
        </div>
      </div>
    </div>
  )
}

function RiskBadge({ level }: { level: number }) {
  const getColor = (risk: number) => {
    if (risk >= 70) return "bg-red-500/20 text-red-400 border-red-500/50"
    if (risk >= 40) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
    return "bg-green-500/20 text-green-400 border-green-500/50"
  }

  return (
    <div className="flex justify-center">
      <span
        className={cn(
          "px-3 py-1 rounded-full text-xs font-medium border",
          getColor(level)
        )}
      >
        {level}%
      </span>
    </div>
  )
}

function PerformanceBadge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500/20 text-green-400 border-green-500/50"
    if (s >= 60) return "bg-blue-500/20 text-blue-400 border-blue-500/50"
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
  }

  return (
    <div className="flex justify-center">
      <span
        className={cn(
          "px-3 py-1 rounded-full text-xs font-medium border",
          getColor(score)
        )}
      >
        {score}
      </span>
    </div>
  )
}

function LiveFeedItem({
  student,
  action,
  timestamp,
  type,
}: {
  student: string
  action: string
  timestamp: Date
  type: "success" | "warning" | "info"
}) {
  const typeStyles = {
    success: "border-l-green-500",
    warning: "border-l-yellow-500",
    info: "border-l-blue-500",
  }

  return (
    <div
      className={cn(
        "bg-gray-800 border-l-4 rounded-r-lg p-3",
        typeStyles[type]
      )}
    >
      <p className="text-sm">
        <span className="font-semibold">{student}</span> {action}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {formatRelativeTime(timestamp)}
      </p>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "Hace unos segundos"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)} días`
}
