import React from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '../ui/dropdown-menu'
import { LogOut, LayoutGrid } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface UserProfileButtonProps {
  className?: string
}

const UserProfileButton: React.FC<UserProfileButtonProps> = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  // Generate initials from displayName or email
  const getInitials = (): string => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const handleSignOut = async () => {
    await logout()
  }

  const handleGoToCanvases = () => {
    navigate('/canvases')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-full h-10 w-10 p-0 hover:bg-gray-200"
          title="User profile"
        >
          <Avatar className="h-8 w-8">
            {user.photoURL && (
              <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
            )}
            <AvatarFallback className="text-xs font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white">
        <DropdownMenuLabel className="font-semibold">
          {user.displayName || 'User'}
        </DropdownMenuLabel>
        {user.email && (
          <div className="px-2 py-1.5 text-sm text-gray-500 truncate">
            {user.email}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleGoToCanvases}
          className="cursor-pointer"
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          All Canvases
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserProfileButton
