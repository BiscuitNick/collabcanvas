import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Users, Settings } from 'lucide-react'
import { CanvasSettings } from '../canvas/CanvasSettings'
import { useCanvasId } from '../../contexts/CanvasContext'
import { useAuth } from '../../hooks/useAuth'
import type { PresenceUser } from '../../types'

interface OnlineUsersWidgetProps {
  presence: PresenceUser[]
  onClose?: () => void
}

const OnlineUsersWidget: React.FC<OnlineUsersWidgetProps> = ({ presence, onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users')
  const canvasId = useCanvasId()
  const { user } = useAuth()

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
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Online
            <span className={`ml-0.5 ${activeTab === 'users' ? 'text-blue-600' : 'text-gray-500'}`}>
              ({presence.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
            title="Close"
          >
            ✕
          </Button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'users' ? (
          <div className="p-3 space-y-1.5">
            {presence.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">No users online</div>
            ) : (
              presence.map(presenceUser => (
                <div
                  key={presenceUser.userId}
                  className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded"
                  style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: presenceUser.color }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      {presenceUser.photoURL && (
                        <AvatarImage src={presenceUser.photoURL} alt={presenceUser.userName} />
                      )}
                      <AvatarFallback className="text-xs font-semibold bg-gray-300 text-gray-700">
                        {getInitials(presenceUser.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-gray-700 truncate">{presenceUser.userName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {user?.uid ? (
              <CanvasSettings canvasId={canvasId} userId={user.uid} />
            ) : (
              <div className="p-4 text-xs text-gray-400 text-center">
                Please log in to manage canvas settings
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OnlineUsersWidget
