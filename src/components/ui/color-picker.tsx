import * as React from "react"
import { Input } from "./input"
import { cn } from "../../lib/utils"

interface ColorPickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value?: string
  onValueChange?: (value: string) => void
}

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, value, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value)
      onChange?.(e)
    }

    return (
      <Input
        type="color"
        ref={ref}
        value={value}
        onChange={handleChange}
        className={cn("h-10 w-16 p-1", className)}
        {...props}
      />
    )
  }
)
ColorPicker.displayName = "ColorPicker"

export { ColorPicker }
