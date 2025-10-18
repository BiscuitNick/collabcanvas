import React from 'react'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import type { PresenceUser } from '../../types'

interface OnlineUsersWidgetProps {
  presence: PresenceUser[]
  onClose?: () => void
}

const OnlineUsersWidget: React.FC<OnlineUsersWidgetProps> = ({ presence, onClose }) => {
  // Generate initials from user name
  const getInitials = (userName: string): string => {
    return userName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
        <h4 className="text-xs font-semibold text-gray-700">Online Users</h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">{presence.length}</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
              title="Close Online Users"
            >
              ✕
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
        {presence.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-4">No users online</div>
        ) : (
          presence.map(user => (
            <div
              key={user.userId}
              className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded"
              style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: user.color }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  {user.photoURL && (
                    <AvatarImage src={user.photoURL} alt={user.userName} />
                  )}
                  <AvatarFallback className="text-xs font-semibold bg-gray-300 text-gray-700">
                    {getInitials(user.userName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-gray-700 truncate">{user.userName}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OnlineUsersWidget
