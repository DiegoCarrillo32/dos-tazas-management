import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { StatCard } from './StatCard'
import type { LucideIcon } from 'lucide-react'

interface SortableStatCardProps {
  id: string
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: string
  color?: string
  className?: string
}

export function SortableStatCard({ id, className, ...props }: SortableStatCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
    >
      <StatCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

