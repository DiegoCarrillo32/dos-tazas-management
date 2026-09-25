import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { StatCard, type StatCardProps } from './StatCard'

interface SortableStatCardProps extends Omit<StatCardProps, 'dragHandleProps'> {
  id: string
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
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
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

