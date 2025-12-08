/**
 * Skeleton Loading Component
 * Muestra placeholders animados mientras carga el contenido
 * Mejora la percepción de velocidad
 */

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-800/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * Skeleton presets para componentes comunes
 */
export function SkeletonCard() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

export function SkeletonCodeEditor() {
  return (
    <div className="space-y-2 p-4">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function SkeletonChat() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-16 w-3/4 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-24 w-5/6 rounded-2xl" />
      </div>
    </div>
  )
}
