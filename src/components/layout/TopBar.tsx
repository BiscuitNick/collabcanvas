import React from 'react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { cn } from '../../lib/utils'

interface TopBarProps {
  user: {
    uid: string
    displayName: string | null
    email: string | null
    photoURL: string | null
  } | null
  stageScale: number
  onZoomChange: (scale: number) => void
  onToggleGridlines: () => void
  gridlinesVisible: boolean
  onTogglePropertiesPane: () => void
  propertiesPaneVisible: boolean
  onShare: () => void
  onSignOut: () => void
  presenceUsers: Array<{
    userId: string
    userName: string
    color: string
    isCurrentUser: boolean
  }>
}

const TopBar: React.FC<TopBarProps> = ({
  user,
  stageScale,
  onZoomChange,
  onToggleGridlines,
  gridlinesVisible,
  onTogglePropertiesPane,
  propertiesPaneVisible,
  onShare,
  onSignOut,
  presenceUsers
}) => {
  const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400]
  const currentZoom = Math.round(stageScale * 100)

  const handleZoomChange = (zoom: number) => {
    onZoomChange(zoom / 100)
  }

  const resetZoom = () => {
    onZoomChange(1)
  }

  const fitToScreen = () => {
    // This would be implemented based on canvas content
    onZoomChange(0.8)
  }

  return (
    <div className="h-15 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-gray-900">CollabCanvas</h1>
        
        {/* Gridlines Toggle */}
        <Button
          variant={gridlinesVisible ? "default" : "outline"}
          size="sm"
          onClick={onToggleGridlines}
        >
          Gridlines
        </Button>

        {/* Properties Pane Toggle */}
        <Button
          variant={propertiesPaneVisible ? "default" : "outline"}
          size="sm"
          onClick={onTogglePropertiesPane}
        >
          Properties
        </Button>
      </div>

      {/* Center Section - Zoom Controls */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoomChange(Math.max(25, currentZoom - 25))}
        >
          −
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-20">
              {currentZoom}%
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuLabel>Zoom Level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {zoomLevels.map((zoom) => (
              <DropdownMenuItem
                key={zoom}
                onClick={() => handleZoomChange(zoom)}
                className={cn(
                  "cursor-pointer",
                  currentZoom === zoom && "bg-accent"
                )}
              >
                {zoom}%
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetZoom} className="cursor-pointer">
              Reset (100%)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={fitToScreen} className="cursor-pointer">
              Fit to Screen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoomChange(Math.min(400, currentZoom + 25))}
        >
          +
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Presence Users */}
        <div className="flex items-center space-x-1">
          {presenceUsers.slice(0, 3).map((presenceUser) => (
            <div
              key={presenceUser.userId}
              className="relative"
              title={presenceUser.userName}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: presenceUser.color }}
              >
                {presenceUser.userName.charAt(0).toUpperCase()}
              </div>
              {presenceUser.isCurrentUser && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
          ))}
          {presenceUsers.length > 3 && (
            <Badge variant="secondary" className="ml-1">
              +{presenceUsers.length - 3}
            </Badge>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Share Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
        >
          Share
        </Button>

        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                  <AvatarFallback>
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export default TopBar
