import React from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Separator } from './separator'

export const TestComponent: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">shadcn/ui Test Component</h2>
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="test-input">Test Input</Label>
        <Input id="test-input" placeholder="Type something..." />
      </div>
      <div className="flex gap-2">
        <Button>Default Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="secondary">Secondary Button</Button>
      </div>
    </div>
  )
}
