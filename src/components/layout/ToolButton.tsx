import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface ToolButtonProps {
  onClick: () => void
  icon: React.ReactNode
  title: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'lg' | 'icon'
}

const ToolButton: React.FC<ToolButtonProps> = ({
  onClick,
  icon,
  title,
  className,
  variant = 'default',
  size = 'sm'
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(
        "bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200",
        className
      )}
      title={title}
    >
      {icon}
    </Button>
  )
}

export default ToolButton
